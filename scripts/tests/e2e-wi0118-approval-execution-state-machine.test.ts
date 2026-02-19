import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;
type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
  if (organizationId) {
    headers["x-actor-organization-id"] = organizationId;
  }
  return headers;
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

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const approvalPolicyRoute = await import("../../src/app/api/approval/policy/route.ts");
  const approvalTemplatesRoute = await import("../../src/app/api/approval/templates/route.ts");
  const approvalExecutionsRoute = await import("../../src/app/api/approval/executions/route.ts");
  const approvalStageHistoryRoute = await import("../../src/app/api/approval/stage-history/route.ts");

  const attendanceRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );

  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveApproveRoute = await import("../../src/app/api/leave/requests/[requestId]/approve/route.ts");
  const leaveBalanceRoute = await import("../../src/app/api/leave/balances/[employeeId]/route.ts");

  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const payrollConfirmRoute = await import("../../src/app/api/payroll/runs/[runId]/confirm/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "FlowHR WI-0118 Org" }, actorHeaders("admin", "ADM-1180"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const employeeId = "EMP-WI0118-01";
  const createEmployeeResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: employeeId,
        organizationId,
        name: "WI-0118 Employee",
        active: true
      },
      actorHeaders("admin", "ADM-1180", organizationId)
    )
  );
  assert.equal(createEmployeeResponse.status, 201);

  const upsertPolicyResponse = await approvalPolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/approval/policy",
      {
        organizationId,
        attendanceApproverRole: "manager",
        leaveApproverRole: "manager",
        payrollApproverRole: "payroll_operator"
      },
      actorHeaders("admin", "ADM-1180", organizationId)
    )
  );
  assert.equal(upsertPolicyResponse.status, 200);

  for (const domain of ["ATTENDANCE", "LEAVE", "PAYROLL"] as const) {
    const stageOneRole = domain === "PAYROLL" ? "payroll_operator" : "manager";
    const createTemplateResponse = await approvalTemplatesRoute.POST(
      jsonRequest(
        "POST",
        "/api/approval/templates",
        {
          organizationId,
          name: `${domain.toLowerCase()}-two-step`,
          domain,
          approvalStages: [
            {
              stageIndex: 1,
              label: "stage1-review",
              approverRoles: [stageOneRole],
              minApprovals: 1
            },
            {
              stageIndex: 2,
              label: "admin-final",
              approverRoles: ["admin"],
              minApprovals: 1
            }
          ],
          active: true
        },
        actorHeaders("admin", "ADM-1180", organizationId)
      )
    );
    assert.equal(createTemplateResponse.status, 201, `${domain} template create should succeed`);
  }

  const createAttendanceResponse = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId,
        checkInAt: "2026-02-24T09:00:00+09:00",
        checkOutAt: "2026-02-24T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", employeeId, organizationId)
    )
  );
  assert.equal(createAttendanceResponse.status, 201);
  const createAttendanceBody = await readJson<{ record: { id: string } }>(createAttendanceResponse);
  const attendanceId = createAttendanceBody.record.id;

  const attendanceManagerApprove = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1180", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(attendanceManagerApprove.status, 200, "attendance stage-1 approve should succeed");
  const attendanceManagerApproveBody = await readJson<{ record: { state: string } }>(attendanceManagerApprove);
  assert.equal(attendanceManagerApproveBody.record.state, "PENDING");
  assert.ok(
    !getRuntimeMemoryDomainEvents().some((event) => event.name === "attendance.approved.v1"),
    "attendance approved event must not be emitted before final stage"
  );

  const attendanceExecutionList = await approvalExecutionsRoute.GET(
    new Request(
      `http://localhost/api/approval/executions?organizationId=${organizationId}&domain=ATTENDANCE&targetEntityType=AttendanceRecord&targetEntityId=${attendanceId}`,
      {
        method: "GET",
        headers: actorHeaders("admin", "ADM-1180", organizationId)
      }
    )
  );
  assert.equal(attendanceExecutionList.status, 200);
  const attendanceExecutionListBody = await readJson<{
    executions: Array<{
      state: string;
      currentStageIndex: number;
      totalStages: number;
      targetEntityId: string;
    }>;
  }>(attendanceExecutionList);
  assert.equal(attendanceExecutionListBody.executions.length, 1);
  assert.equal(attendanceExecutionListBody.executions[0].targetEntityId, attendanceId);
  assert.equal(attendanceExecutionListBody.executions[0].state, "PENDING");
  assert.equal(attendanceExecutionListBody.executions[0].currentStageIndex, 2);
  assert.equal(attendanceExecutionListBody.executions[0].totalStages, 2);

  const attendanceManagerApproveAgain = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1180", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(
    attendanceManagerApproveAgain.status,
    403,
    "stage-2 should deny manager role when admin is required"
  );

  const attendanceAdminApprove = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceId}/approve`, {
      method: "POST",
      headers: actorHeaders("admin", "ADM-1180", organizationId)
    }),
    { params: Promise.resolve({ recordId: attendanceId }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(attendanceAdminApprove.status, 200);
  const attendanceAdminApproveBody = await readJson<{ record: { state: string } }>(attendanceAdminApprove);
  assert.equal(attendanceAdminApproveBody.record.state, "APPROVED");

  const createLeaveResponse = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        startDate: "2026-03-03T09:00:00+09:00",
        endDate: "2026-03-03T18:00:00+09:00",
        reason: "wi0118 leave"
      },
      actorHeaders("employee", employeeId, organizationId)
    )
  );
  assert.equal(createLeaveResponse.status, 201);
  const createLeaveBody = await readJson<{ request: { id: string; state: string } }>(createLeaveResponse);
  const leaveRequestId = createLeaveBody.request.id;
  assert.equal(createLeaveBody.request.state, "PENDING");

  const leaveManagerApprove = await leaveApproveRoute.POST(
    new Request(`http://localhost/api/leave/requests/${leaveRequestId}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1180", organizationId)
    }),
    { params: Promise.resolve({ requestId: leaveRequestId }) } as RouteContext<{ requestId: string }>
  );
  assert.equal(leaveManagerApprove.status, 200);
  const leaveManagerApproveBody = await readJson<{
    request: { state: string };
    balance: { usedDays: number };
  }>(leaveManagerApprove);
  assert.equal(leaveManagerApproveBody.request.state, "PENDING");
  assert.equal(leaveManagerApproveBody.balance.usedDays, 0);
  assert.ok(
    !getRuntimeMemoryDomainEvents().some((event) => event.name === "leave.approved.v1"),
    "leave approved event must not be emitted before final stage"
  );

  const leaveBalanceBeforeFinal = await leaveBalanceRoute.GET(
    new Request(`http://localhost/api/leave/balances/${employeeId}`, {
      method: "GET",
      headers: actorHeaders("payroll_operator", "PAY-1180", organizationId)
    }),
    { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(leaveBalanceBeforeFinal.status, 200);
  const leaveBalanceBeforeFinalBody = await readJson<{ balance: { usedDays: number } }>(leaveBalanceBeforeFinal);
  assert.equal(leaveBalanceBeforeFinalBody.balance.usedDays, 0);

  const leaveAdminApprove = await leaveApproveRoute.POST(
    new Request(`http://localhost/api/leave/requests/${leaveRequestId}/approve`, {
      method: "POST",
      headers: actorHeaders("admin", "ADM-1180", organizationId)
    }),
    { params: Promise.resolve({ requestId: leaveRequestId }) } as RouteContext<{ requestId: string }>
  );
  assert.equal(leaveAdminApprove.status, 200);
  const leaveAdminApproveBody = await readJson<{
    request: { state: string; days: number };
    balance: { usedDays: number };
  }>(leaveAdminApprove);
  assert.equal(leaveAdminApproveBody.request.state, "APPROVED");
  assert.equal(leaveAdminApproveBody.balance.usedDays, leaveAdminApproveBody.request.days);

  const payrollPreviewResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId,
        hourlyRateKrw: 12000
      },
      actorHeaders("payroll_operator", "PAY-1180", organizationId)
    )
  );
  assert.equal(payrollPreviewResponse.status, 200);
  const payrollPreviewBody = await readJson<{ run: { id: string; state: string } }>(payrollPreviewResponse);
  const payrollRunId = payrollPreviewBody.run.id;
  assert.equal(payrollPreviewBody.run.state, "PREVIEWED");

  const payrollManagerConfirm = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${payrollRunId}/confirm`, {
      method: "POST",
      headers: actorHeaders("payroll_operator", "PAY-1180", organizationId)
    }),
    { params: Promise.resolve({ runId: payrollRunId }) } as RouteContext<{ runId: string }>
  );
  assert.equal(payrollManagerConfirm.status, 200);
  const payrollManagerConfirmBody = await readJson<{ run: { state: string } }>(payrollManagerConfirm);
  assert.equal(payrollManagerConfirmBody.run.state, "PREVIEWED");
  assert.ok(
    !getRuntimeMemoryDomainEvents().some((event) => event.name === "payroll.confirmed.v1"),
    "payroll confirmed event must not be emitted before final stage"
  );

  const payrollAdminConfirm = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${payrollRunId}/confirm`, {
      method: "POST",
      headers: actorHeaders("admin", "ADM-1180", organizationId)
    }),
    { params: Promise.resolve({ runId: payrollRunId }) } as RouteContext<{ runId: string }>
  );
  assert.equal(payrollAdminConfirm.status, 200);
  const payrollAdminConfirmBody = await readJson<{ run: { state: string } }>(payrollAdminConfirm);
  assert.equal(payrollAdminConfirmBody.run.state, "CONFIRMED");

  const attendanceHistoryResponse = await approvalStageHistoryRoute.GET(
    new Request(
      `http://localhost/api/approval/stage-history?organizationId=${organizationId}&targetEntityType=AttendanceRecord&targetEntityId=${attendanceId}&limit=20`,
      {
        method: "GET",
        headers: actorHeaders("admin", "ADM-1180", organizationId)
      }
    )
  );
  assert.equal(attendanceHistoryResponse.status, 200);
  const attendanceHistoryBody = await readJson<{
    history: Array<{ stageIndex: number; stageLabel: string; allowed: boolean }>;
  }>(attendanceHistoryResponse);
  assert.ok(attendanceHistoryBody.history.some((item) => item.stageIndex === 1 && item.allowed));
  assert.ok(attendanceHistoryBody.history.some((item) => item.stageIndex === 2 && item.allowed));
  assert.ok(
    attendanceHistoryBody.history.some((item) => item.stageLabel === "stage1-review:approve"),
    "stage history should include stage-1 approve action label"
  );
  assert.ok(
    attendanceHistoryBody.history.some((item) => item.stageLabel === "admin-final:approve"),
    "stage history should include stage-2 approve action label"
  );

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("approval.execution.listed"), "audit should include approval.execution.listed");

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("attendance.approved.v1"), "attendance final approval event should be emitted");
  assert.ok(eventNames.includes("leave.approved.v1"), "leave final approval event should be emitted");
  assert.ok(eventNames.includes("payroll.confirmed.v1"), "payroll final confirmation event should be emitted");

  console.log("e2e-wi0118-approval-execution-state-machine.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
