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
runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
runtimeEnv.FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1 = "true";

type JsonPayload = Record<string, unknown>;
type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
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
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const deductionProfileRoute = await import(
    "../../src/app/api/payroll/deduction-profiles/[profileId]/route.ts"
  );
  const payrollPreviewWithDeductionsRoute = await import(
    "../../src/app/api/payroll/runs/preview-with-deductions/route.ts"
  );
  const payrollConfirmRoute = await import("../../src/app/api/payroll/runs/[runId]/confirm/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-2601",
        checkInAt: "2026-02-12T09:00:00+09:00",
        checkOutAt: "2026-02-12T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-2601")
    )
  );
  assert.equal(createResponse.status, 201, "attendance creation should succeed");
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-2601")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200, "attendance approve should succeed");

  const profileId = "DP-KR-STANDARD";
  const upsertResponse = await deductionProfileRoute.PUT(
    jsonRequest(
      "PUT",
      `/api/payroll/deduction-profiles/${profileId}`,
      {
        name: "KR Standard Payroll Profile",
        mode: "profile",
        withholdingRate: 0.03,
        socialInsuranceRate: 0.045,
        fixedOtherDeductionKrw: 2000,
        active: true
      },
      actorHeaders("payroll_operator", "PAY-2601")
    ),
    { params: Promise.resolve({ profileId }) } as RouteContext<{ profileId: string }>
  );
  assert.equal(upsertResponse.status, 200, "deduction profile upsert should succeed");
  const upsertBody = await readJson<{ profile: { version: number } }>(upsertResponse);
  assert.equal(upsertBody.profile.version, 1);

  const getProfileResponse = await deductionProfileRoute.GET(
    new Request(`http://localhost/api/payroll/deduction-profiles/${profileId}`, {
      method: "GET",
      headers: actorHeaders("payroll_operator", "PAY-2601")
    }),
    { params: Promise.resolve({ profileId }) } as RouteContext<{ profileId: string }>
  );
  assert.equal(getProfileResponse.status, 200, "deduction profile read should succeed");

  const previewResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-2601",
        hourlyRateKrw: 12000,
        deductionMode: "profile",
        profileId
      },
      actorHeaders("payroll_operator", "PAY-2601")
    )
  );
  assert.equal(previewResponse.status, 200, "profile mode preview should succeed");
  const previewBody = await readJson<{
    run: {
      id: string;
      deductionProfileId: string | null;
      deductionProfileVersion: number | null;
    };
    summary: {
      deductionMode: "manual" | "profile";
      profileId: string | null;
      profileVersion: number | null;
      grossPayKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.deductionMode, "profile");
  assert.equal(previewBody.summary.profileId, profileId);
  assert.equal(previewBody.summary.profileVersion, 1);
  assert.equal(previewBody.summary.grossPayKrw, 96000);
  assert.equal(previewBody.summary.totalDeductionsKrw, 9200);
  assert.equal(previewBody.summary.netPayKrw, 86800);
  assert.equal(previewBody.run.deductionProfileId, profileId);
  assert.equal(previewBody.run.deductionProfileVersion, 1);

  const confirmResponse = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${previewBody.run.id}/confirm`, {
      method: "POST",
      headers: actorHeaders("payroll_operator", "PAY-2601")
    }),
    { params: Promise.resolve({ runId: previewBody.run.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(confirmResponse.status, 200, "payroll confirm should succeed");

  assert.deepEqual(getMemoryAuditActions(), [
    "attendance.recorded",
    "attendance.approved",
    "payroll.deduction_profile.updated",
    "payroll.deduction_profile.read",
    "payroll.deductions_calculated",
    "payroll.confirmed"
  ]);
  assert.deepEqual(
    getRuntimeMemoryDomainEvents().map((event) => event.name),
    [
      "attendance.recorded.v1",
      "attendance.approved.v1",
      "payroll.deduction_profile.updated.v1",
      "payroll.deductions.calculated.v1",
      "payroll.confirmed.v1"
    ]
  );
}

run()
  .then(() => {
    console.log("e2e-wi0006-payroll-deduction-profile.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
