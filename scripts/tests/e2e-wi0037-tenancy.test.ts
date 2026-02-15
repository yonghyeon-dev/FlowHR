import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_TENANCY_V1 = "true";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

type JsonPayload = Record<string, unknown>;
type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

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
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const attendanceListRoute = await import("../../src/app/api/attendance/records/route.ts");
  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const payrollRunsRoute = await import("../../src/app/api/payroll/runs/route.ts");
  const deductionProfileRoute = await import(
    "../../src/app/api/payroll/deduction-profiles/[profileId]/route.ts"
  );
  const deductionProfileListRoute = await import(
    "../../src/app/api/payroll/deduction-profiles/route.ts"
  );

  resetMemoryDataAccess();

  const orgA = await memoryDataAccess.organizations.create({ name: "Org A" });
  const orgB = await memoryDataAccess.organizations.create({ name: "Org B" });

  await memoryDataAccess.employees.create({ id: "EMP-A1", organizationId: orgA.id });
  await memoryDataAccess.employees.create({ id: "EMP-B1", organizationId: orgB.id });

  const createA = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-A1",
        checkInAt: "2026-02-01T09:00:00+09:00",
        checkOutAt: "2026-02-01T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-A", orgA.id)
    )
  );
  assert.equal(createA.status, 201, "tenant A attendance create should succeed");
  const createABody = await readJson<{ record: { id: string } }>(createA);

  const createB = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-B1",
        checkInAt: "2026-02-01T09:00:00+09:00",
        checkOutAt: "2026-02-01T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-B", orgB.id)
    )
  );
  assert.equal(createB.status, 201, "tenant B attendance create should succeed");
  const createBBody = await readJson<{ record: { id: string } }>(createB);

  const crossTenantCreate = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-B1",
        checkInAt: "2026-02-02T09:00:00+09:00",
        checkOutAt: "2026-02-02T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("manager", "MGR-A", orgA.id)
    )
  );
  assert.equal(crossTenantCreate.status, 404, "cross-tenant attendance create should be denied");
  const crossTenantCreateBody = await readJson<{ error: string }>(crossTenantCreate);
  assert.equal(crossTenantCreateBody.error, "employee not found");

  const approveA = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createABody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-A", orgA.id)
    }),
    { params: Promise.resolve({ recordId: createABody.record.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(approveA.status, 200, "tenant A attendance approve should succeed");

  const approveB = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createBBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-B", orgB.id)
    }),
    { params: Promise.resolve({ recordId: createBBody.record.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(approveB.status, 200, "tenant B attendance approve should succeed");

  const listA = await attendanceListRoute.GET(
    new Request(
      "http://localhost/api/attendance/records?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00",
      { method: "GET", headers: actorHeaders("payroll_operator", "PAY-A", orgA.id) }
    )
  );
  assert.equal(listA.status, 200, "tenant A attendance list should succeed");
  const listABody = await readJson<{ records: Array<{ employeeId: string }> }>(listA);
  assert.equal(listABody.records.length, 1, "tenant A should see only its own records");
  assert.equal(listABody.records[0]?.employeeId, "EMP-A1");

  const crossTenantPayrollPreview = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-B1",
        hourlyRateKrw: 12000
      },
      actorHeaders("payroll_operator", "PAY-A", orgA.id)
    )
  );
  assert.equal(crossTenantPayrollPreview.status, 404, "cross-tenant payroll preview should be denied");
  const crossTenantPayrollPreviewBody = await readJson<{ error: string }>(crossTenantPayrollPreview);
  assert.equal(crossTenantPayrollPreviewBody.error, "employee not found");

  const previewA = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-A1",
        hourlyRateKrw: 12000
      },
      actorHeaders("payroll_operator", "PAY-A", orgA.id)
    )
  );
  assert.equal(previewA.status, 200, "tenant A payroll preview should succeed");
  const previewABody = await readJson<{ run: { id: string } }>(previewA);

  const previewB = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-B1",
        hourlyRateKrw: 12000
      },
      actorHeaders("payroll_operator", "PAY-B", orgB.id)
    )
  );
  assert.equal(previewB.status, 200, "tenant B payroll preview should succeed");
  const previewBBody = await readJson<{ run: { id: string } }>(previewB);

  const listRunsA = await payrollRunsRoute.GET(
    new Request(
      "http://localhost/api/payroll/runs?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00",
      { method: "GET", headers: actorHeaders("payroll_operator", "PAY-A", orgA.id) }
    )
  );
  assert.equal(listRunsA.status, 200, "tenant A payroll run list should succeed");
  const listRunsABody = await readJson<{ runs: Array<{ id: string }> }>(listRunsA);
  assert.ok(listRunsABody.runs.some((run) => run.id === previewABody.run.id), "tenant A should see its run");
  assert.ok(
    !listRunsABody.runs.some((run) => run.id === previewBBody.run.id),
    "tenant A must not see tenant B run"
  );

  const profileId = "DP-TENANT-A";
  const upsertProfileA = await deductionProfileRoute.PUT(
    jsonRequest(
      "PUT",
      `/api/payroll/deduction-profiles/${profileId}`,
      {
        name: "Tenant A Profile",
        mode: "profile",
        withholdingRate: 0.03,
        socialInsuranceRate: 0.045,
        fixedOtherDeductionKrw: 2000,
        active: true
      },
      actorHeaders("payroll_operator", "PAY-A", orgA.id)
    ),
    { params: Promise.resolve({ profileId }) } as RouteContext<{ profileId: string }>
  );
  assert.equal(upsertProfileA.status, 200, "tenant A profile upsert should succeed");

  const listProfilesB = await deductionProfileListRoute.GET(
    new Request("http://localhost/api/payroll/deduction-profiles", {
      method: "GET",
      headers: actorHeaders("payroll_operator", "PAY-B", orgB.id)
    })
  );
  assert.equal(listProfilesB.status, 200, "tenant B profile list should succeed");
  const listProfilesBBody = await readJson<{ profiles: Array<{ id: string }> }>(listProfilesB);
  assert.ok(
    listProfilesBBody.profiles.every((profile) => profile.id !== profileId),
    "tenant B must not see tenant A profiles"
  );

  const readProfileCrossTenant = await deductionProfileRoute.GET(
    new Request(`http://localhost/api/payroll/deduction-profiles/${profileId}`, {
      method: "GET",
      headers: actorHeaders("payroll_operator", "PAY-B", orgB.id)
    }),
    { params: Promise.resolve({ profileId }) } as RouteContext<{ profileId: string }>
  );
  assert.equal(readProfileCrossTenant.status, 404, "cross-tenant profile read should be denied");
  const readProfileCrossTenantBody = await readJson<{ error: string }>(readProfileCrossTenant);
  assert.equal(readProfileCrossTenantBody.error, "deduction profile not found");
}

run()
  .then(() => {
    console.log("e2e-wi0037-tenancy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

