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
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const attendanceRejectRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/reject/route.ts"
  );
  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveApproveRoute = await import("../../src/app/api/leave/requests/[requestId]/approve/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0904 Org" });
  const employeeAId = "EMP-WI0904-A";
  const employeeBId = "EMP-WI0904-B";
  const managerId = "MGR-WI0904-1";

  await memoryDataAccess.employees.create({ id: employeeAId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: employeeBId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: managerId, organizationId: organization.id });

  const employeeAHeaders = actorHeaders("employee", employeeAId, organization.id);
  const employeeBHeaders = actorHeaders("employee", employeeBId, organization.id);
  const managerHeaders = actorHeaders("manager", managerId, organization.id);

  const attendanceCreateFirstResponse = await attendanceRecordsRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: employeeAId,
        checkInAt: "2026-03-11T09:00:00+09:00",
        checkOutAt: "2026-03-11T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      employeeAHeaders
    )
  );
  assert.equal(attendanceCreateFirstResponse.status, 201, "employee A attendance create should succeed");
  const attendanceCreateFirstBody = (await readJson(attendanceCreateFirstResponse)) as {
    record: { id: string; employeeId: string; state: string };
  };
  assert.ok(attendanceCreateFirstBody.record.id, "first attendance record id should exist");
  assert.equal(attendanceCreateFirstBody.record.employeeId, employeeAId);
  assert.equal(attendanceCreateFirstBody.record.state, "PENDING");

  const leaveCreateResponse = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: employeeBId,
        leaveType: "ANNUAL",
        startDate: "2026-03-12T00:00:00+09:00",
        endDate: "2026-03-12T23:59:59+09:00",
        reason: "medical appointment"
      },
      employeeBHeaders
    )
  );
  assert.equal(leaveCreateResponse.status, 201, "employee B leave create should succeed");
  const leaveCreateBody = (await readJson(leaveCreateResponse)) as {
    request: { id: string; employeeId: string; state: string };
  };
  assert.ok(leaveCreateBody.request.id, "leave request id should exist");
  assert.equal(leaveCreateBody.request.employeeId, employeeBId);
  assert.equal(leaveCreateBody.request.state, "PENDING");

  const attendanceApproveDenied = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceCreateFirstBody.record.id}/approve`, {
      method: "POST",
      headers: employeeAHeaders
    }),
    { params: Promise.resolve({ recordId: attendanceCreateFirstBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(attendanceApproveDenied.status, 403, "employee should not approve attendance");

  const leaveApproveDenied = await leaveApproveRoute.POST(
    new Request(`http://localhost/api/leave/requests/${leaveCreateBody.request.id}/approve`, {
      method: "POST",
      headers: employeeBHeaders
    }),
    { params: Promise.resolve({ requestId: leaveCreateBody.request.id }) } as RouteContext<{
      requestId: string;
    }>
  );
  assert.equal(leaveApproveDenied.status, 403, "employee should not approve leave");

  const attendanceApproveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceCreateFirstBody.record.id}/approve`, {
      method: "POST",
      headers: managerHeaders
    }),
    { params: Promise.resolve({ recordId: attendanceCreateFirstBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(attendanceApproveResponse.status, 200, "manager should approve attendance");
  const attendanceApproveBody = (await readJson(attendanceApproveResponse)) as {
    record: { id: string; state: string };
  };
  assert.equal(attendanceApproveBody.record.id, attendanceCreateFirstBody.record.id);
  assert.equal(attendanceApproveBody.record.state, "APPROVED");

  const leaveApproveResponse = await leaveApproveRoute.POST(
    new Request(`http://localhost/api/leave/requests/${leaveCreateBody.request.id}/approve`, {
      method: "POST",
      headers: managerHeaders
    }),
    { params: Promise.resolve({ requestId: leaveCreateBody.request.id }) } as RouteContext<{
      requestId: string;
    }>
  );
  assert.equal(leaveApproveResponse.status, 200, "manager should approve leave");
  const leaveApproveBody = (await readJson(leaveApproveResponse)) as {
    request: { id: string; state: string };
  };
  assert.equal(leaveApproveBody.request.id, leaveCreateBody.request.id);
  assert.equal(leaveApproveBody.request.state, "APPROVED");

  const attendanceCreateSecondResponse = await attendanceRecordsRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: employeeAId,
        checkInAt: "2026-03-12T09:00:00+09:00",
        checkOutAt: "2026-03-12T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      employeeAHeaders
    )
  );
  assert.equal(attendanceCreateSecondResponse.status, 201, "employee A second attendance create should succeed");
  const attendanceCreateSecondBody = (await readJson(attendanceCreateSecondResponse)) as {
    record: { id: string; employeeId: string; state: string };
  };
  assert.ok(attendanceCreateSecondBody.record.id, "second attendance record id should exist");
  assert.equal(attendanceCreateSecondBody.record.employeeId, employeeAId);
  assert.equal(attendanceCreateSecondBody.record.state, "PENDING");

  const attendanceRejectResponse = await attendanceRejectRoute.POST(
    jsonRequest(
      "POST",
      `/api/attendance/records/${attendanceCreateSecondBody.record.id}/reject`,
      {
        reason: "missing supporting evidence"
      },
      managerHeaders
    ),
    { params: Promise.resolve({ recordId: attendanceCreateSecondBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(attendanceRejectResponse.status, 200, "manager should reject attendance");
  const attendanceRejectBody = (await readJson(attendanceRejectResponse)) as {
    record: { id: string; state: string };
  };
  assert.equal(attendanceRejectBody.record.id, attendanceCreateSecondBody.record.id);
  assert.equal(attendanceRejectBody.record.state, "REJECTED");

  const attendanceApprovedListResponse = await attendanceRecordsRoute.GET(
    new Request(
      "http://localhost/api/attendance/records?from=2026-03-11T00:00:00+09:00&to=2026-03-13T00:00:00+09:00&state=APPROVED",
      {
        method: "GET",
        headers: employeeAHeaders
      }
    )
  );
  assert.equal(attendanceApprovedListResponse.status, 200, "employee A should list approved attendance records");
  const attendanceApprovedListBody = (await readJson(attendanceApprovedListResponse)) as {
    records: Array<{ id: string; employeeId: string; state: string }>;
  };
  assert.ok(
    attendanceApprovedListBody.records.some((record) => record.id === attendanceCreateFirstBody.record.id),
    "approved attendance list should include first record"
  );
  assert.ok(
    attendanceApprovedListBody.records.every(
      (record) => record.employeeId === employeeAId && record.state === "APPROVED"
    ),
    "approved attendance list should contain only employee A approved records"
  );

  const attendanceRejectedListResponse = await attendanceRecordsRoute.GET(
    new Request(
      "http://localhost/api/attendance/records?from=2026-03-11T00:00:00+09:00&to=2026-03-13T00:00:00+09:00&state=REJECTED",
      {
        method: "GET",
        headers: employeeAHeaders
      }
    )
  );
  assert.equal(attendanceRejectedListResponse.status, 200, "employee A should list rejected attendance records");
  const attendanceRejectedListBody = (await readJson(attendanceRejectedListResponse)) as {
    records: Array<{ id: string; employeeId: string; state: string }>;
  };
  assert.ok(
    attendanceRejectedListBody.records.some((record) => record.id === attendanceCreateSecondBody.record.id),
    "rejected attendance list should include second record"
  );
  assert.ok(
    attendanceRejectedListBody.records.every(
      (record) => record.employeeId === employeeAId && record.state === "REJECTED"
    ),
    "rejected attendance list should contain only employee A rejected records"
  );

  const leaveApprovedListResponse = await leaveRequestsRoute.GET(
    new Request(
      "http://localhost/api/leave/requests?from=2026-03-11T00:00:00+09:00&to=2026-03-13T00:00:00+09:00&state=APPROVED",
      {
        method: "GET",
        headers: employeeBHeaders
      }
    )
  );
  assert.equal(leaveApprovedListResponse.status, 200, "employee B should list approved leave requests");
  const leaveApprovedListBody = (await readJson(leaveApprovedListResponse)) as {
    requests: Array<{ id: string; employeeId: string; state: string }>;
  };
  assert.ok(
    leaveApprovedListBody.requests.some((request) => request.id === leaveCreateBody.request.id),
    "approved leave list should include approved request"
  );
  assert.ok(
    leaveApprovedListBody.requests.every((request) => request.employeeId === employeeBId && request.state === "APPROVED"),
    "approved leave list should contain only employee B approved requests"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0904-admin-approval-flow.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
