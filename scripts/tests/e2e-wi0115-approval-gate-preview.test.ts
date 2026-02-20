import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

function actorHeaders(role: string, actorId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
}

function jsonRequest(method: string, path: string, payload: unknown, headers: Record<string, string>) {
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
  const templateRoute = await import("../../src/app/api/approval/templates/route.ts");
  const delegationRoute = await import("../../src/app/api/approval/delegations/route.ts");
  const previewRoute = await import("../../src/app/api/approval/policy/gate-preview/route.ts");

  resetMemoryDataAccess();

  const org = await memoryDataAccess.organizations.create({ name: "Org Approval Preview" });

  const createTemplateResponse = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/templates",
      {
        organizationId: org.id,
        name: "payroll-high-admin",
        domain: "PAYROLL",
        approverRoles: ["admin"],
        payrollGrossPayMinKrw: 100000,
        active: true
      },
      actorHeaders("admin", "ADM-1")
    )
  );
  assert.equal(createTemplateResponse.status, 201);

  const highPayrollDenied = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/policy/gate-preview",
      {
        organizationId: org.id,
        domain: "PAYROLL",
        actorRole: "payroll_operator",
        actorId: "PAY-1",
        payrollGrossPayKrw: 120000
      },
      actorHeaders("admin", "ADM-1")
    )
  );
  assert.equal(highPayrollDenied.status, 200);
  const highPayrollDeniedBody = await readJson<{
    preview: {
      allowed: boolean;
      allowedReason: string;
      expectedRoles: string[];
      matchedTemplates: Array<{ id: string }>;
      fallbackRole: string;
    };
  }>(highPayrollDenied);
  assert.equal(highPayrollDeniedBody.preview.allowed, false);
  assert.equal(highPayrollDeniedBody.preview.allowedReason, "denied");
  assert.deepEqual(highPayrollDeniedBody.preview.expectedRoles, ["admin"]);
  assert.equal(highPayrollDeniedBody.preview.matchedTemplates.length, 1);
  assert.equal(highPayrollDeniedBody.preview.fallbackRole, "payroll_operator");

  const lowPayrollFallback = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/policy/gate-preview",
      {
        organizationId: org.id,
        domain: "PAYROLL",
        actorRole: "payroll_operator",
        actorId: "PAY-1",
        payrollGrossPayKrw: 80000
      },
      actorHeaders("admin", "ADM-1")
    )
  );
  assert.equal(lowPayrollFallback.status, 200);
  const lowPayrollFallbackBody = await readJson<{
    preview: { allowed: boolean; allowedReason: string; expectedRoles: string[]; matchedTemplates: unknown[] };
  }>(lowPayrollFallback);
  assert.equal(lowPayrollFallbackBody.preview.allowed, true);
  assert.equal(lowPayrollFallbackBody.preview.allowedReason, "expected_role");
  assert.deepEqual(lowPayrollFallbackBody.preview.expectedRoles, ["payroll_operator"]);
  assert.equal(lowPayrollFallbackBody.preview.matchedTemplates.length, 0);

  const now = new Date();
  const startsAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const endsAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const delegationCreate = await delegationRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/delegations",
      {
        organizationId: org.id,
        domain: "PAYROLL",
        delegatorRole: "admin",
        delegateActorId: "EMP-DELEGATE-1",
        startsAt,
        endsAt,
        active: true
      },
      actorHeaders("admin", "ADM-1")
    )
  );
  assert.equal(delegationCreate.status, 201);

  const delegatedPreview = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/policy/gate-preview",
      {
        organizationId: org.id,
        domain: "PAYROLL",
        actorRole: "employee",
        actorId: "EMP-DELEGATE-1",
        payrollGrossPayKrw: 120000
      },
      actorHeaders("admin", "ADM-1")
    )
  );
  assert.equal(delegatedPreview.status, 200);
  const delegatedPreviewBody = await readJson<{
    preview: { allowed: boolean; allowedReason: string; activeDelegations: Array<{ id: string }> };
  }>(delegatedPreview);
  assert.equal(delegatedPreviewBody.preview.allowed, true);
  assert.equal(delegatedPreviewBody.preview.allowedReason, "active_delegation");
  assert.equal(delegatedPreviewBody.preview.activeDelegations.length, 1);

  const invalidNonPayrollPreview = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/approval/policy/gate-preview",
      {
        organizationId: org.id,
        domain: "LEAVE",
        actorRole: "manager",
        payrollGrossPayKrw: 100000
      },
      actorHeaders("admin", "ADM-1")
    )
  );
  assert.equal(invalidNonPayrollPreview.status, 400);

  console.log("e2e-wi0115-approval-gate-preview.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
