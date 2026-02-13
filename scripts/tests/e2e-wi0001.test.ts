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
  const { resetMemoryDataAccess, getMemoryAuditActions, getMemoryAuditEntries } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const attendanceRejectRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/reject/route.ts"
  );
  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const payrollConfirmRoute = await import(
    "../../src/app/api/payroll/runs/[runId]/confirm/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

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

  const duplicateApproveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdRecord.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1")
    }),
    { params: Promise.resolve({ recordId: createdRecord.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(duplicateApproveResponse.status, 409, "duplicate attendance approval should be rejected");

  const rejectedCreateResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-1001",
        checkInAt: "2026-02-03T09:00:00+09:00",
        checkOutAt: "2026-02-03T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-1001")
    )
  );
  assert.equal(rejectedCreateResponse.status, 201, "second attendance creation should succeed");
  const rejectedCreateBody = (await readJson(rejectedCreateResponse)) as {
    record: { id: string; state: string };
  };
  assert.equal(rejectedCreateBody.record.state, "PENDING");

  const invalidJsonRejectResponse = await attendanceRejectRoute.POST(
    new Request(`http://localhost/api/attendance/records/${rejectedCreateBody.record.id}/reject`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1"),
      body: "{"
    }),
    { params: Promise.resolve({ recordId: rejectedCreateBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(invalidJsonRejectResponse.status, 400, "invalid reject JSON should be rejected");
  const invalidJsonRejectBody = (await readJson(invalidJsonRejectResponse)) as {
    error: string;
  };
  assert.equal(invalidJsonRejectBody.error, "invalid JSON body");

  const invalidPayloadRejectResponse = await attendanceRejectRoute.POST(
    new Request(`http://localhost/api/attendance/records/${rejectedCreateBody.record.id}/reject`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1"),
      body: JSON.stringify({
        reason: "x".repeat(501)
      })
    }),
    { params: Promise.resolve({ recordId: rejectedCreateBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(invalidPayloadRejectResponse.status, 400, "oversized reject reason should be rejected");
  const invalidPayloadRejectBody = (await readJson(invalidPayloadRejectResponse)) as {
    error: string;
  };
  assert.equal(invalidPayloadRejectBody.error, "invalid payload");

  const rejectResponse = await attendanceRejectRoute.POST(
    new Request(`http://localhost/api/attendance/records/${rejectedCreateBody.record.id}/reject`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1"),
      body: JSON.stringify({
        reason: "manual correction mismatch"
      })
    }),
    { params: Promise.resolve({ recordId: rejectedCreateBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(rejectResponse.status, 200, "manager should reject attendance");
  const rejectBody = (await readJson(rejectResponse)) as {
    record: { state: string };
  };
  assert.equal(rejectBody.record.state, "REJECTED");

  const duplicateRejectResponse = await attendanceRejectRoute.POST(
    new Request(`http://localhost/api/attendance/records/${rejectedCreateBody.record.id}/reject`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1")
    }),
    { params: Promise.resolve({ recordId: rejectedCreateBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(duplicateRejectResponse.status, 409, "duplicate attendance rejection should be rejected");

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

  const duplicateConfirmResponse = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${previewBody.run.id}/confirm`, {
      method: "POST",
      headers: actorHeaders("payroll_operator", "PAY-1")
    }),
    { params: Promise.resolve({ runId: previewBody.run.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(duplicateConfirmResponse.status, 409, "duplicate payroll confirmation should be rejected");

  const rejectedAuditEntry = getMemoryAuditEntries().find((entry) => entry.action === "attendance.rejected");
  assert.ok(rejectedAuditEntry, "attendance.rejected audit entry should exist");
  assert.deepEqual(rejectedAuditEntry.payload, {
    employeeId: "EMP-1001",
    reason: "manual correction mismatch"
  });

  assert.deepEqual(getMemoryAuditActions(), [
    "attendance.recorded",
    "attendance.approved",
    "attendance.recorded",
    "attendance.rejected",
    "payroll.calculated",
    "payroll.confirmed"
  ]);
  assert.deepEqual(
    getRuntimeMemoryDomainEvents().map((event) => event.name),
    [
      "attendance.recorded.v1",
      "attendance.approved.v1",
      "attendance.recorded.v1",
      "attendance.rejected.v1",
      "payroll.calculated.v1",
      "payroll.confirmed.v1"
    ]
  );
}

run()
  .then(() => {
    console.log("e2e-wi0001.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
