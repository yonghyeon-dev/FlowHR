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

async function readJson(response: Response) {
  return (await response.json()) as unknown;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceRecordRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");
  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveCancelRoute = await import("../../src/app/api/leave/requests/[requestId]/cancel/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0903 Org" });
  const employeeId = "EMP-WI0903-1001";
  const otherEmployeeId = "EMP-WI0903-2002";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: otherEmployeeId, organizationId: organization.id });

  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);
  const attendanceFrom = "2026-03-04T00:00:00+09:00";
  const attendanceTo = "2026-03-04T23:59:59+09:00";
  const leaveFrom = "2026-03-04T00:00:00+09:00";
  const leaveTo = "2026-03-10T23:59:59+09:00";

  const clockInResponse = await attendanceRecordsRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId,
        checkInAt: "2026-03-04T09:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false,
        notes: "clock-in"
      },
      employeeHeaders
    )
  );
  assert.equal(clockInResponse.status, 201, "clock-in should succeed");
  const clockInBody = (await readJson(clockInResponse)) as {
    record: { id: string; employeeId: string; checkOutAt: string | null; state: string };
  };
  assert.ok(clockInBody.record.id, "clock-in response should include record id");
  assert.equal(clockInBody.record.employeeId, employeeId, "clock-in record employeeId should match actor");
  assert.equal(clockInBody.record.checkOutAt, null, "clock-in record should not have checkOutAt yet");
  assert.equal(clockInBody.record.state, "PENDING", "clock-in record should be pending");

  const attendanceListResponse = await attendanceRecordsRoute.GET(
    new Request(
      `http://localhost/api/attendance/records?from=${attendanceFrom}&to=${attendanceTo}`,
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(attendanceListResponse.status, 200, "employee should list own attendance records");
  const attendanceListBody = (await readJson(attendanceListResponse)) as {
    records: Array<{ id: string; employeeId: string; checkOutAt: string | null; state: string }>;
  };
  const listedClockInRecord = attendanceListBody.records.find((record) => record.id === clockInBody.record.id);
  assert.ok(listedClockInRecord, "attendance list should include created clock-in record");
  assert.equal(listedClockInRecord.employeeId, employeeId, "attendance list should be scoped to self");
  assert.equal(listedClockInRecord.state, "PENDING", "clock-in record should remain pending before clock-out");
  assert.equal(listedClockInRecord.checkOutAt, null, "clock-in record should still have no checkOutAt");

  const otherEmployeeAccessDenied = await attendanceRecordsRoute.GET(
    new Request(
      `http://localhost/api/attendance/records?from=${attendanceFrom}&to=${attendanceTo}&employeeId=${otherEmployeeId}`,
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(otherEmployeeAccessDenied.status, 403, "employee should not access another employee attendance");

  const clockOutResponse = await attendanceRecordRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/attendance/records/${clockInBody.record.id}`,
      {
        checkOutAt: "2026-03-04T18:00:00+09:00",
        breakMinutes: 60,
        notes: "clock-out"
      },
      employeeHeaders
    ),
    { params: Promise.resolve({ recordId: clockInBody.record.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(clockOutResponse.status, 200, "clock-out should succeed");
  const clockOutBody = (await readJson(clockOutResponse)) as {
    record: { id: string; employeeId: string; checkOutAt: string | null; state: string };
  };
  assert.equal(clockOutBody.record.id, clockInBody.record.id, "clock-out should update the same attendance record");
  assert.equal(clockOutBody.record.employeeId, employeeId, "clock-out response employeeId should match actor");
  assert.ok(clockOutBody.record.checkOutAt, "clock-out response should include checkOutAt");
  assert.equal(clockOutBody.record.state, "PENDING", "clock-out update should keep record pending");

  const leaveCreateResponse = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        startDate: "2026-03-05T00:00:00+09:00",
        endDate: "2026-03-06T23:59:59+09:00",
        reason: "annual leave request"
      },
      employeeHeaders
    )
  );
  assert.equal(leaveCreateResponse.status, 201, "leave request create should succeed");
  const leaveCreateBody = (await readJson(leaveCreateResponse)) as {
    request: {
      id: string;
      employeeId: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      state: string;
    };
  };
  assert.ok(leaveCreateBody.request.id, "leave request response should include request id");
  assert.equal(leaveCreateBody.request.employeeId, employeeId, "leave request should be created for self");
  assert.equal(leaveCreateBody.request.leaveType, "ANNUAL", "leave request leave type should be ANNUAL");
  assert.equal(leaveCreateBody.request.state, "PENDING", "new leave request should be pending");
  assert.ok(leaveCreateBody.request.startDate, "leave request should include startDate");
  assert.ok(leaveCreateBody.request.endDate, "leave request should include endDate");

  const leaveListBeforeCancelResponse = await leaveRequestsRoute.GET(
    new Request(
      `http://localhost/api/leave/requests?from=${leaveFrom}&to=${leaveTo}`,
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(leaveListBeforeCancelResponse.status, 200, "employee should list own leave requests");
  const leaveListBeforeCancelBody = (await readJson(leaveListBeforeCancelResponse)) as {
    requests: Array<{ id: string; employeeId: string; state: string }>;
  };
  const listedLeaveBeforeCancel = leaveListBeforeCancelBody.requests.find(
    (request) => request.id === leaveCreateBody.request.id
  );
  assert.ok(listedLeaveBeforeCancel, "leave list should include created request");
  assert.equal(listedLeaveBeforeCancel.employeeId, employeeId, "leave list should be scoped to self");
  assert.equal(listedLeaveBeforeCancel.state, "PENDING", "leave request should be pending before cancel");

  const leaveCancelResponse = await leaveCancelRoute.POST(
    jsonRequest(
      "POST",
      `/api/leave/requests/${leaveCreateBody.request.id}/cancel`,
      {
        reason: "plan changed"
      },
      employeeHeaders
    ),
    { params: Promise.resolve({ requestId: leaveCreateBody.request.id }) } as RouteContext<{ requestId: string }>
  );
  assert.equal(leaveCancelResponse.status, 200, "leave cancel should succeed");
  const leaveCancelBody = (await readJson(leaveCancelResponse)) as {
    request: { id: string; employeeId: string; state: string; decisionReason: string | null };
  };
  assert.equal(leaveCancelBody.request.id, leaveCreateBody.request.id, "leave cancel should target created request");
  assert.equal(leaveCancelBody.request.employeeId, employeeId, "leave cancel should stay scoped to self");
  assert.equal(leaveCancelBody.request.state, "CANCELED", "leave request should be canceled");
  assert.equal(leaveCancelBody.request.decisionReason, "plan changed", "cancel reason should be reflected");

  const leaveListAfterCancelResponse = await leaveRequestsRoute.GET(
    new Request(
      `http://localhost/api/leave/requests?from=${leaveFrom}&to=${leaveTo}`,
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(leaveListAfterCancelResponse.status, 200, "employee should list leave requests after cancel");
  const leaveListAfterCancelBody = (await readJson(leaveListAfterCancelResponse)) as {
    requests: Array<{ id: string; employeeId: string; state: string }>;
  };
  const listedLeaveAfterCancel = leaveListAfterCancelBody.requests.find(
    (request) => request.id === leaveCreateBody.request.id
  );
  assert.ok(listedLeaveAfterCancel, "canceled leave request should still exist in list");
  assert.equal(listedLeaveAfterCancel.employeeId, employeeId, "leave list should remain self-scoped");
  assert.equal(listedLeaveAfterCancel.state, "CANCELED", "leave request state should be CANCELED after cancel");
}

run()
  .then(() => {
    console.log("e2e-wi0903-employee-daily-flow.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
