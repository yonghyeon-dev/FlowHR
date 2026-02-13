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

async function readJson(response: Response) {
  return (await response.json()) as unknown;
}

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

async function run() {
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const payrollConfirmRoute = await import(
    "../../src/app/api/payroll/runs/[runId]/confirm/route.ts"
  );

  resetMemoryDataAccess();

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-1001",
        checkInAt: "2026-02-02T09:00:00+09:00",
        checkOutAt: "2026-02-02T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-1001")
    )
  );
  assert.equal(createResponse.status, 201, "attendance creation should succeed");
  const createdBody = (await readJson(createResponse)) as {
    record: { id: string; state: string };
  };
  const createdRecord = createdBody.record;
  assert.ok(createdRecord?.id, "created record id should exist");
  assert.equal(createdRecord.state, "PENDING");

  const approvalDenied = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdRecord.id}/approve`, {
      method: "POST",
      headers: actorHeaders("employee", "EMP-1001")
    }),
    { params: Promise.resolve({ recordId: createdRecord.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(approvalDenied.status, 403, "employee should not approve attendance");

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdRecord.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1")
    }),
    { params: Promise.resolve({ recordId: createdRecord.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(approveResponse.status, 200, "manager should approve attendance");
  const approveBody = (await readJson(approveResponse)) as {
    record: { state: string };
  };
  assert.equal(approveBody.record.state, "APPROVED");

  const previewResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-1001",
        hourlyRateKrw: 12000
      },
      actorHeaders("payroll_operator", "PAY-1")
    )
  );
  assert.equal(previewResponse.status, 200, "payroll preview should succeed");
  const previewBody = (await readJson(previewResponse)) as {
    run: { id: string };
    summary: {
      sourceRecordCount: number;
      totals: {
        regular: number;
        overtime: number;
        night: number;
        holiday: number;
      };
      grossPayKrw: number;
    };
  };
  assert.equal(previewBody.summary.sourceRecordCount, 1);
  assert.deepEqual(previewBody.summary.totals, {
    regular: 480,
    overtime: 0,
    night: 0,
    holiday: 0
  });
  assert.equal(previewBody.summary.grossPayKrw, 96000);

  const confirmResponse = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${previewBody.run.id}/confirm`, {
      method: "POST",
      headers: actorHeaders("payroll_operator", "PAY-1")
    }),
    { params: Promise.resolve({ runId: previewBody.run.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(confirmResponse.status, 200, "payroll confirmation should succeed");
  const confirmBody = (await readJson(confirmResponse)) as {
    run: { state: string };
  };
  assert.equal(confirmBody.run.state, "CONFIRMED");

  assert.deepEqual(getMemoryAuditActions(), [
    "attendance.recorded",
    "attendance.approved",
    "payroll.calculated",
    "payroll.confirmed"
  ]);
}

run()
  .then(() => {
    console.log("e2e-wi0001.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
