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
runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

type JsonPayload = Record<string, unknown>;
type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
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
  const payrollPreviewRoute = await import("../../src/app/api/payroll/preview/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-1028 Org" });
  const employeeId = "EMP-WI1028-1001";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });

  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);
  const managerHeaders = actorHeaders("manager", "MGR-WI1028-1001", organization.id);
  const payrollHeaders = actorHeaders("payroll_operator", "PAY-WI1028-1001", organization.id);

  const approvedAttendanceResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId,
        checkInAt: "2026-02-10T09:00:00+09:00",
        checkOutAt: "2026-02-10T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      employeeHeaders
    )
  );
  assert.equal(approvedAttendanceResponse.status, 201, "approved-period attendance creation should succeed");
  const approvedAttendanceBody = await readJson<{ record: { id: string } }>(approvedAttendanceResponse);

  const approveAttendanceResponse = await attendanceApproveRoute.POST(
    new Request(
      `http://localhost/api/attendance/records/${approvedAttendanceBody.record.id}/approve`,
      {
        method: "POST",
        headers: managerHeaders
      }
    ),
    { params: Promise.resolve({ recordId: approvedAttendanceBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveAttendanceResponse.status, 200, "attendance approval should succeed");

  const pendingAttendanceResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId,
        checkInAt: "2026-02-11T09:00:00+09:00",
        checkOutAt: "2026-02-11T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      employeeHeaders
    )
  );
  assert.equal(pendingAttendanceResponse.status, 201, "pending attendance creation should succeed");

  const approvedOnlyPreviewResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/preview",
      {
        periodStart: "2026-02-10T00:00:00+09:00",
        periodEnd: "2026-02-10T23:59:59+09:00",
        employeeId,
        hourlyRateKrw: 12000
      },
      payrollHeaders
    )
  );
  assert.equal(approvedOnlyPreviewResponse.status, 200, "approved-only payroll preview should succeed");
  const approvedOnlyPreviewBody = await readJson<{
    summary: {
      sourceRecordCount: number;
      pendingRecordCount: number;
      grossPayKrw: number;
    };
    warnings: string[];
  }>(approvedOnlyPreviewResponse);
  assert.equal(approvedOnlyPreviewBody.summary.sourceRecordCount, 1);
  assert.equal(approvedOnlyPreviewBody.summary.pendingRecordCount, 0);
  assert.equal(approvedOnlyPreviewBody.summary.grossPayKrw, 96000);
  assert.deepEqual(approvedOnlyPreviewBody.warnings, []);

  const monthlyPreviewResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId,
        hourlyRateKrw: 12000
      },
      payrollHeaders
    )
  );
  assert.equal(monthlyPreviewResponse.status, 200, "monthly payroll preview should succeed");
  const monthlyPreviewBody = await readJson<{
    summary: {
      sourceRecordCount: number;
      pendingRecordCount: number;
      grossPayKrw: number;
    };
    warnings: string[];
  }>(monthlyPreviewResponse);
  assert.equal(monthlyPreviewBody.summary.sourceRecordCount, 1);
  assert.equal(monthlyPreviewBody.summary.pendingRecordCount, 1);
  assert.equal(monthlyPreviewBody.summary.grossPayKrw, 96000);
  assert.deepEqual(monthlyPreviewBody.warnings, [
    "미승인 출퇴근 기록 1건은 급여 계산에서 제외되었습니다."
  ]);
}

run()
  .then(() => {
    console.log("e2e-wi1028-payroll-preview-unapproved-warning.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
