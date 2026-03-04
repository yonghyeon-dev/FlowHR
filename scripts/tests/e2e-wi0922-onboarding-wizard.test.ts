import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

function routeFilePath() {
  return join(
    process.cwd(),
    "src",
    "app",
    "api",
    "organizations",
    "[organizationId]",
    "setup",
    "route.ts"
  );
}

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

function jsonRequest(
  method: string,
  path: string,
  payload: Record<string, unknown>,
  headers: Record<string, string>
) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

const validPayload = {
  businessRegistrationNumber: "123-45-67890",
  industry: "SaaS",
  representativeName: "홍길동",
  workStartTime: "09:00",
  workEndTime: "18:00",
  workDays: [1, 2, 3, 4, 5],
  timezone: "Asia/Seoul"
};

async function run() {
  assert.equal(existsSync(routeFilePath()), true, "organization setup route file should exist");

  const route = await import("../../src/app/api/organizations/[organizationId]/setup/route.ts");
  assert.equal(typeof route.POST, "function", "organization setup POST handler should exist");

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0922 Org" });
  await memoryDataAccess.employees.create({ id: "EMP-WI0922-1001", organizationId: organization.id });

  const adminHeaders = actorHeaders("admin", "ADM-WI0922-1001", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0922-1001", organization.id);

  const successResponse = await route.POST(
    jsonRequest(
      "POST",
      `/api/organizations/${organization.id}/setup`,
      {
        ...validPayload,
        name: "온보딩 완료 조직"
      },
      adminHeaders
    ),
    { params: Promise.resolve({ organizationId: organization.id }) }
  );
  assert.equal(successResponse.status, 200, "admin should complete organization onboarding setup");

  const successBody = (await successResponse.json()) as {
    organization: { isOnboardingComplete: boolean; name: string };
  };
  assert.equal(successBody.organization.isOnboardingComplete, true, "onboarding completion flag should be true");
  assert.equal(successBody.organization.name, "온보딩 완료 조직", "organization name should be updated");

  const employeeDeniedResponse = await route.POST(
    jsonRequest("POST", `/api/organizations/${organization.id}/setup`, validPayload, employeeHeaders),
    { params: Promise.resolve({ organizationId: organization.id }) }
  );
  assert.equal(employeeDeniedResponse.status, 403, "employee role should be forbidden");

  const missingFieldResponse = await route.POST(
    jsonRequest(
      "POST",
      `/api/organizations/${organization.id}/setup`,
      {
        industry: "SaaS",
        representativeName: "홍길동",
        workStartTime: "09:00",
        workEndTime: "18:00",
        workDays: [1, 2, 3, 4, 5],
        timezone: "Asia/Seoul"
      },
      adminHeaders
    ),
    { params: Promise.resolve({ organizationId: organization.id }) }
  );
  assert.equal(missingFieldResponse.status, 400, "missing required fields should return 400");
}

run()
  .then(() => {
    console.log("e2e-wi0922-onboarding-wizard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
