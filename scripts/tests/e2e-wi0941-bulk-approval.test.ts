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

async function createPendingAttendanceRecords(input: {
  attendanceRoute: typeof import("../../src/app/api/attendance/records/route");
  headers: Record<string, string>;
  employeeId: string;
  count: number;
  dayStart: number;
}) {
  const ids: string[] = [];
  for (let index = 0; index < input.count; index += 1) {
    const day = String(input.dayStart + index).padStart(2, "0");
    const response = await input.attendanceRoute.POST(
      jsonRequest(
        "POST",
        "/api/attendance/records",
        {
          employeeId: input.employeeId,
          checkInAt: `2026-04-${day}T09:00:00+09:00`,
          checkOutAt: `2026-04-${day}T18:00:00+09:00`,
          breakMinutes: 60,
          isHoliday: false
        },
        input.headers
      )
    );
    assert.equal(response.status, 201, "attendance create should succeed");
    const body = (await readJson(response)) as { record: { id: string; state: string } };
    assert.equal(body.record.state, "PENDING");
    ids.push(body.record.id);
  }
  return ids;
}

async function createPendingLeaveRequests(input: {
  leaveRoute: typeof import("../../src/app/api/leave/requests/route");
  headers: Record<string, string>;
  employeeId: string;
  count: number;
  dayStart: number;
}) {
  const ids: string[] = [];
  for (let index = 0; index < input.count; index += 1) {
    const day = String(input.dayStart + index).padStart(2, "0");
    const response = await input.leaveRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/requests",
        {
          employeeId: input.employeeId,
          leaveType: "ANNUAL",
          startDate: `2026-05-${day}T00:00:00+09:00`,
          endDate: `2026-05-${day}T23:59:59+09:00`,
          reason: `leave-${day}`
        },
        input.headers
      )
    );
    assert.equal(response.status, 201, "leave request create should succeed");
    const body = (await readJson(response)) as { request: { id: string; state: string } };
    assert.equal(body.request.state, "PENDING");
    ids.push(body.request.id);
  }
  return ids;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
  const adminApprovalsBulkRoute = await import("../../src/app/api/admin/approvals/bulk/route.ts");
  const adminApprovalsPendingRoute = await import("../../src/app/api/admin/approvals/pending/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0941 Org" });
  const employeeAId = "EMP-WI0941-A";
  const employeeBId = "EMP-WI0941-B";
  const managerId = "MGR-WI0941-1";
  const adminId = "ADM-WI0941-1";

  await memoryDataAccess.employees.create({
    id: employeeAId,
    organizationId: organization.id,
    name: "Employee A"
  });
  await memoryDataAccess.employees.create({
    id: employeeBId,
    organizationId: organization.id,
    name: "Employee B"
  });
  await memoryDataAccess.employees.create({
    id: managerId,
    organizationId: organization.id,
    name: "Manager"
  });
  await memoryDataAccess.employees.create({
    id: adminId,
    organizationId: organization.id,
    name: "Admin"
  });

  const employeeAHeaders = actorHeaders("employee", employeeAId, organization.id);
  const employeeBHeaders = actorHeaders("employee", employeeBId, organization.id);
  const managerHeaders = actorHeaders("manager", managerId, organization.id);
  const adminHeaders = actorHeaders("admin", adminId, organization.id);

  const firstAttendanceIds = await createPendingAttendanceRecords({
    attendanceRoute: attendanceRecordsRoute,
    headers: employeeAHeaders,
    employeeId: employeeAId,
    count: 3,
    dayStart: 1
  });
  const firstLeaveIds = await createPendingLeaveRequests({
    leaveRoute: leaveRequestsRoute,
    headers: employeeBHeaders,
    employeeId: employeeBId,
    count: 2,
    dayStart: 1
  });

  const pendingResponse = await adminApprovalsPendingRoute.GET(
    new Request("http://localhost/api/admin/approvals/pending", {
      method: "GET",
      headers: managerHeaders
    })
  );
  assert.equal(pendingResponse.status, 200, "pending approvals list should succeed");
  const pendingBody = (await readJson(pendingResponse)) as {
    items: Array<{ type: "attendance" | "leave"; id: string; employeeName: string }>;
    total: number;
  };
  assert.equal(pendingBody.total, 5, "pending list should include attendance + leave items");
  assert.equal(
    pendingBody.items.filter((item) => item.type === "attendance").length,
    3,
    "pending list should include 3 attendance items"
  );
  assert.equal(
    pendingBody.items.filter((item) => item.type === "leave").length,
    2,
    "pending list should include 2 leave items"
  );
  assert.ok(
    pendingBody.items.some((item) => item.employeeName === "Employee A"),
    "pending list should include employee name"
  );

  const pendingTypeFilterResponse = await adminApprovalsPendingRoute.GET(
    new Request("http://localhost/api/admin/approvals/pending?type=attendance", {
      method: "GET",
      headers: managerHeaders
    })
  );
  assert.equal(pendingTypeFilterResponse.status, 200, "pending approvals type filter should succeed");
  const pendingTypeBody = (await readJson(pendingTypeFilterResponse)) as {
    items: Array<{ type: "attendance" | "leave" }>;
    total: number;
  };
  assert.equal(pendingTypeBody.total, 3, "attendance filter should return 3 items");
  assert.ok(
    pendingTypeBody.items.every((item) => item.type === "attendance"),
    "type filter should include attendance only"
  );

  const pendingPagedResponse = await adminApprovalsPendingRoute.GET(
    new Request("http://localhost/api/admin/approvals/pending?limit=2&offset=1", {
      method: "GET",
      headers: managerHeaders
    })
  );
  assert.equal(pendingPagedResponse.status, 200, "pending approvals paging should succeed");
  const pendingPagedBody = (await readJson(pendingPagedResponse)) as {
    items: unknown[];
    total: number;
  };
  assert.equal(pendingPagedBody.total, 5, "paging should not change total");
  assert.equal(pendingPagedBody.items.length, 2, "paging should apply limit");

  const approveAllResponse = await adminApprovalsBulkRoute.POST(
    jsonRequest(
      "POST",
      "/api/admin/approvals/bulk",
      {
        action: "APPROVE",
        items: [
          ...firstAttendanceIds.map((id) => ({ type: "attendance", id })),
          ...firstLeaveIds.map((id) => ({ type: "leave", id }))
        ]
      },
      managerHeaders
    )
  );
  assert.equal(approveAllResponse.status, 200, "bulk approve should succeed");
  const approveAllBody = (await readJson(approveAllResponse)) as {
    processed: number;
    succeeded: number;
    failed: number;
    results: Array<{ status: "success" | "error" }>;
  };
  assert.equal(approveAllBody.processed, 5);
  assert.equal(approveAllBody.succeeded, 5);
  assert.equal(approveAllBody.failed, 0);
  assert.ok(approveAllBody.results.every((item) => item.status === "success"));

  for (const attendanceId of firstAttendanceIds) {
    const record = await memoryDataAccess.attendance.findById(attendanceId);
    assert.equal(record?.state, "APPROVED", "attendance record should be approved");
  }
  for (const leaveId of firstLeaveIds) {
    const request = await memoryDataAccess.leave.findById(leaveId);
    assert.equal(request?.state, "APPROVED", "leave request should be approved");
  }

  const secondAttendanceIds = await createPendingAttendanceRecords({
    attendanceRoute: attendanceRecordsRoute,
    headers: employeeAHeaders,
    employeeId: employeeAId,
    count: 3,
    dayStart: 10
  });
  const secondLeaveIds = await createPendingLeaveRequests({
    leaveRoute: leaveRequestsRoute,
    headers: employeeBHeaders,
    employeeId: employeeBId,
    count: 2,
    dayStart: 10
  });

  const rejectReason = "policy mismatch";
  const rejectAllResponse = await adminApprovalsBulkRoute.POST(
    jsonRequest(
      "POST",
      "/api/admin/approvals/bulk",
      {
        action: "REJECT",
        reason: rejectReason,
        items: [
          ...secondAttendanceIds.map((id) => ({ type: "attendance", id })),
          ...secondLeaveIds.map((id) => ({ type: "leave", id }))
        ]
      },
      adminHeaders
    )
  );
  assert.equal(rejectAllResponse.status, 200, "bulk reject should succeed");
  const rejectAllBody = (await readJson(rejectAllResponse)) as {
    processed: number;
    succeeded: number;
    failed: number;
    results: Array<{ status: "success" | "error" }>;
  };
  assert.equal(rejectAllBody.processed, 5);
  assert.equal(rejectAllBody.succeeded, 5);
  assert.equal(rejectAllBody.failed, 0);
  assert.ok(rejectAllBody.results.every((item) => item.status === "success"));

  for (const attendanceId of secondAttendanceIds) {
    const record = await memoryDataAccess.attendance.findById(attendanceId);
    assert.equal(record?.state, "REJECTED", "attendance record should be rejected");
  }
  for (const leaveId of secondLeaveIds) {
    const request = await memoryDataAccess.leave.findById(leaveId);
    assert.equal(request?.state, "REJECTED", "leave request should be rejected");
    assert.equal(request?.decisionReason, rejectReason, "leave rejection reason should be persisted");
  }

  const partialLeaveIds = await createPendingLeaveRequests({
    leaveRoute: leaveRequestsRoute,
    headers: employeeBHeaders,
    employeeId: employeeBId,
    count: 1,
    dayStart: 20
  });
  const partialFailureResponse = await adminApprovalsBulkRoute.POST(
    jsonRequest(
      "POST",
      "/api/admin/approvals/bulk",
      {
        action: "APPROVE",
        items: [
          { type: "leave", id: partialLeaveIds[0] },
          { type: "leave", id: "LEAVE-INVALID-ID" }
        ]
      },
      managerHeaders
    )
  );
  assert.equal(partialFailureResponse.status, 200, "partial bulk approve should still return success");
  const partialFailureBody = (await readJson(partialFailureResponse)) as {
    processed: number;
    succeeded: number;
    failed: number;
    results: Array<{ id: string; status: "success" | "error"; error?: string }>;
  };
  assert.equal(partialFailureBody.processed, 2);
  assert.equal(partialFailureBody.succeeded, 1);
  assert.equal(partialFailureBody.failed, 1);
  assert.equal(
    partialFailureBody.results.find((item) => item.id === partialLeaveIds[0])?.status,
    "success",
    "valid id should succeed"
  );
  const invalidResult = partialFailureBody.results.find((item) => item.id === "LEAVE-INVALID-ID");
  assert.equal(invalidResult?.status, "error", "invalid id should fail");
  assert.ok(invalidResult?.error, "invalid result should include an error message");
  const approvedPartialLeave = await memoryDataAccess.leave.findById(partialLeaveIds[0]);
  assert.equal(approvedPartialLeave?.state, "APPROVED", "valid item should be processed despite partial failure");

  const tooManyItems = Array.from({ length: 51 }, (_, index) => ({
    type: "attendance",
    id: `ATD-TOO-MANY-${index + 1}`
  }));
  const maxLimitResponse = await adminApprovalsBulkRoute.POST(
    jsonRequest(
      "POST",
      "/api/admin/approvals/bulk",
      {
        action: "APPROVE",
        items: tooManyItems
      },
      managerHeaders
    )
  );
  assert.equal(maxLimitResponse.status, 400, "request with over 50 items should fail");

  const employeeForbiddenResponse = await adminApprovalsBulkRoute.POST(
    jsonRequest(
      "POST",
      "/api/admin/approvals/bulk",
      {
        action: "APPROVE",
        items: [{ type: "attendance", id: firstAttendanceIds[0] }]
      },
      employeeAHeaders
    )
  );
  assert.equal(employeeForbiddenResponse.status, 403, "employee must be forbidden");
}

run()
  .then(() => {
    console.log("e2e-wi0941-bulk-approval.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

