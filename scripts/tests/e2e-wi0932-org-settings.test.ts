import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

function jsonRequest(method: string, path: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const route = await import("../../src/app/api/admin/organization/settings/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0932 Org" });
  const adminHeaders = actorHeaders("admin", "ADM-WI0932-1001", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0932-1001", organization.id);

  const getDefaultsResponse = await route.GET(
    new Request("http://localhost/api/admin/organization/settings", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(getDefaultsResponse.status, 200, "admin should read organization settings");

  const defaultsBody = await readJson<{
    settings: {
      name: string;
      businessNumber: string | null;
      fiscalYearStart: string;
      workHoursPerDay: number;
      overtimeThreshold: number;
      timezone: string | null;
    };
  }>(getDefaultsResponse);

  assert.equal(defaultsBody.settings.name, "WI-0932 Org");
  assert.equal(defaultsBody.settings.businessNumber, null);
  assert.equal(defaultsBody.settings.fiscalYearStart, "01-01");
  assert.equal(defaultsBody.settings.workHoursPerDay, 8);
  assert.equal(defaultsBody.settings.overtimeThreshold, 8);
  assert.equal(defaultsBody.settings.timezone, null);

  const patchResponse = await route.PATCH(
    jsonRequest(
      "PATCH",
      "/api/admin/organization/settings",
      {
        name: "WI-0932 Org Updated",
        businessNumber: "123-45-67890",
        fiscalYearStart: "04-01",
        workHoursPerDay: 7.5,
        overtimeThreshold: 8,
        timezone: "Asia/Seoul"
      },
      adminHeaders
    )
  );
  assert.equal(patchResponse.status, 200, "admin should patch organization settings");

  const patchBody = await readJson<{
    settings: {
      name: string;
      businessNumber: string | null;
      fiscalYearStart: string;
      workHoursPerDay: number;
      overtimeThreshold: number;
      timezone: string | null;
    };
  }>(patchResponse);

  assert.equal(patchBody.settings.name, "WI-0932 Org Updated");
  assert.equal(patchBody.settings.businessNumber, "123-45-67890");
  assert.equal(patchBody.settings.fiscalYearStart, "04-01");
  assert.equal(patchBody.settings.workHoursPerDay, 7.5);
  assert.equal(patchBody.settings.overtimeThreshold, 8);
  assert.equal(patchBody.settings.timezone, "Asia/Seoul");

  const forbiddenResponse = await route.GET(
    new Request("http://localhost/api/admin/organization/settings", {
      method: "GET",
      headers: employeeHeaders
    })
  );
  assert.equal(forbiddenResponse.status, 403, "employee role should be forbidden");

  const invalidFieldResponse = await route.PATCH(
    jsonRequest(
      "PATCH",
      "/api/admin/organization/settings",
      {
        workHoursPerDay: -1
      },
      adminHeaders
    )
  );
  assert.equal(invalidFieldResponse.status, 400, "invalid fields should return 400");
}

run()
  .then(() => {
    console.log("e2e-wi0932-org-settings.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
