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
  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
  const leaveCreateRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveUpdateRoute = await import("../../src/app/api/leave/requests/[requestId]/route.ts");
  const leaveApproveRoute = await import(
    "../../src/app/api/leave/requests/[requestId]/approve/route.ts"
  );
  const leaveRejectRoute = await import("../../src/app/api/leave/requests/[requestId]/reject/route.ts");
  const leaveCancelRoute = await import("../../src/app/api/leave/requests/[requestId]/cancel/route.ts");
  const leaveBalanceRoute = await import("../../src/app/api/leave/balances/[employeeId]/route.ts");
  const leaveAccrualSettleRoute = await import("../../src/app/api/leave/accrual/settle/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const employeeId = "EMP-LEAVE-1001";
  const otherEmployeeId = "EMP-LEAVE-2002";

  const unknownEmployeeResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: "EMP-LEAVE-UNKNOWN",
        leaveType: "ANNUAL",
        startDate: "2026-03-01T00:00:00+09:00",
        endDate: "2026-03-01T23:59:59+09:00"
      },
      actorHeaders("employee", "EMP-LEAVE-UNKNOWN")
    )
  );
  assert.equal(unknownEmployeeResponse.status, 404, "unknown employee leave create should be rejected");
  const unknownEmployeeBody = await readJson<{ error: string }>(unknownEmployeeResponse);
  assert.equal(unknownEmployeeBody.error, "employee not found");

  await memoryDataAccess.employees.create({ id: employeeId });
  await memoryDataAccess.employees.create({ id: otherEmployeeId });
  await memoryDataAccess.employees.create({ id: "EMP-LEAVE-3003" });

  const createResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        startDate: "2026-03-03T00:00:00+09:00",
        endDate: "2026-03-04T23:59:59+09:00",
        reason: "vacation"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(createResponse.status, 201, "leave request create should succeed");
  const createBody = await readJson<{
    request: { id: string; state: string; days: number };
  }>(createResponse);
  assert.equal(createBody.request.state, "PENDING");
  assert.equal(createBody.request.days, 2);

  const unauthorizedCreate = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        startDate: "2026-03-10T00:00:00+09:00",
        endDate: "2026-03-10T23:59:59+09:00"
      },
      actorHeaders("employee", otherEmployeeId)
    )
  );
  assert.equal(unauthorizedCreate.status, 403, "employee cannot create leave for another employee");

  const updateResponse = await leaveUpdateRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/leave/requests/${createBody.request.id}`,
      {
        reason: "family trip"
      },
      actorHeaders("employee", employeeId)
    ),
    { params: Promise.resolve({ requestId: createBody.request.id }) } as RouteContext<{ requestId: string }>
  );
  assert.equal(updateResponse.status, 200, "pending leave request update should succeed");

  const approveResponse = await leaveApproveRoute.POST(
    new Request(`http://localhost/api/leave/requests/${createBody.request.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-LEAVE-1")
    }),
    { params: Promise.resolve({ requestId: createBody.request.id }) } as RouteContext<{ requestId: string }>
  );
  assert.equal(approveResponse.status, 200, "manager should approve leave request");
  const approveBody = await readJson<{
    request: { state: string };
    balance: { usedDays: number; remainingDays: number };
  }>(approveResponse);
  assert.equal(approveBody.request.state, "APPROVED");
  assert.equal(approveBody.balance.usedDays, 2);
  assert.equal(approveBody.balance.remainingDays, 13);

  const listSelfResponse = await leaveCreateRoute.GET(
    new Request(
      "http://localhost/api/leave/requests?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00",
      {
        method: "GET",
        headers: actorHeaders("employee", employeeId)
      }
    )
  );
  assert.equal(listSelfResponse.status, 200, "employee should list own leave requests");
  const listSelfBody = await readJson<{
    requests: Array<{ id: string; employeeId: string; state: string }>;
  }>(listSelfResponse);
  assert.ok(
    listSelfBody.requests.some((request) => request.id === createBody.request.id),
    "list should include created leave request"
  );

  const listOtherEmployeeDenied = await leaveCreateRoute.GET(
    new Request(
      "http://localhost/api/leave/requests?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=EMP-OTHER",
      {
        method: "GET",
        headers: actorHeaders("employee", employeeId)
      }
    )
  );
  assert.equal(listOtherEmployeeDenied.status, 403, "employee cannot list other employee leave");

  const managerMissingEmployeeId = await leaveCreateRoute.GET(
    new Request(
      "http://localhost/api/leave/requests?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00",
      {
        method: "GET",
        headers: actorHeaders("manager", "MGR-LEAVE-1")
      }
    )
  );
  assert.equal(managerMissingEmployeeId.status, 400, "manager list query must include employeeId");

  const overlapResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        startDate: "2026-03-04T00:00:00+09:00",
        endDate: "2026-03-05T23:59:59+09:00"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(overlapResponse.status, 409, "overlapping request should be blocked");

  const balanceByPayrollResponse = await leaveBalanceRoute.GET(
    new Request(`http://localhost/api/leave/balances/${employeeId}`, {
      method: "GET",
      headers: actorHeaders("payroll_operator", "PAY-LEAVE-1")
    }),
    { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(balanceByPayrollResponse.status, 200, "payroll operator should read leave balance");

  const deniedBalanceResponse = await leaveBalanceRoute.GET(
    new Request(`http://localhost/api/leave/balances/${employeeId}`, {
      method: "GET",
      headers: actorHeaders("employee", otherEmployeeId)
    }),
    { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(deniedBalanceResponse.status, 403, "other employee should not read target balance");

  const settleResponse = await leaveAccrualSettleRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/accrual/settle",
      {
        employeeId,
        year: 2027
      },
      actorHeaders("payroll_operator", "PAY-LEAVE-1")
    )
  );
  assert.equal(settleResponse.status, 200, "payroll operator should settle leave accrual");
  const settleBody = await readJson<{
    balance: { grantedDays: number; usedDays: number; remainingDays: number; carryOverDays: number };
  }>(settleResponse);
  assert.equal(settleBody.balance.grantedDays, 20);
  assert.equal(settleBody.balance.usedDays, 0);
  assert.equal(settleBody.balance.remainingDays, 20);
  assert.equal(settleBody.balance.carryOverDays, 5);

  const duplicateSettleResponse = await leaveAccrualSettleRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/accrual/settle",
      {
        employeeId,
        year: 2027
      },
      actorHeaders("payroll_operator", "PAY-LEAVE-1")
    )
  );
  assert.equal(duplicateSettleResponse.status, 409, "duplicate accrual settle should be rejected");

  const unauthorizedSettleResponse = await leaveAccrualSettleRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/accrual/settle",
      {
        employeeId,
        year: 2028
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(unauthorizedSettleResponse.status, 403, "employee should not settle leave accrual");

  const rejectCreateResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: otherEmployeeId,
        leaveType: "SICK",
        startDate: "2026-03-10T00:00:00+09:00",
        endDate: "2026-03-10T23:59:59+09:00",
        reason: "cold"
      },
      actorHeaders("employee", otherEmployeeId)
    )
  );
  assert.equal(rejectCreateResponse.status, 201);
  const rejectCreateBody = await readJson<{ request: { id: string } }>(rejectCreateResponse);

  const rejectResponse = await leaveRejectRoute.POST(
    jsonRequest(
      "POST",
      `/api/leave/requests/${rejectCreateBody.request.id}/reject`,
      {
        reason: "conflicts with coverage policy"
      },
      actorHeaders("manager", "MGR-LEAVE-1")
    ),
    {
      params: Promise.resolve({ requestId: rejectCreateBody.request.id })
    } as RouteContext<{ requestId: string }>
  );
  assert.equal(rejectResponse.status, 200, "manager should reject leave request");
  const rejectBody = await readJson<{ request: { state: string; decisionReason: string } }>(rejectResponse);
  assert.equal(rejectBody.request.state, "REJECTED");
  assert.equal(rejectBody.request.decisionReason, "conflicts with coverage policy");

  const cancelCreateResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: "EMP-LEAVE-3003",
        leaveType: "UNPAID",
        startDate: "2026-03-12T00:00:00+09:00",
        endDate: "2026-03-12T23:59:59+09:00"
      },
      actorHeaders("employee", "EMP-LEAVE-3003")
    )
  );
  assert.equal(cancelCreateResponse.status, 201);
  const cancelCreateBody = await readJson<{ request: { id: string } }>(cancelCreateResponse);

  const cancelResponse = await leaveCancelRoute.POST(
    jsonRequest(
      "POST",
      `/api/leave/requests/${cancelCreateBody.request.id}/cancel`,
      {
        reason: "plan changed"
      },
      actorHeaders("employee", "EMP-LEAVE-3003")
    ),
    {
      params: Promise.resolve({ requestId: cancelCreateBody.request.id })
    } as RouteContext<{ requestId: string }>
  );
  assert.equal(cancelResponse.status, 200, "employee should cancel own pending leave request");
  const cancelBody = await readJson<{ request: { state: string } }>(cancelResponse);
  assert.equal(cancelBody.request.state, "CANCELED");

  const actions = getMemoryAuditActions();
  for (const action of [
    "leave.requested",
    "leave.updated",
    "leave.approved",
    "leave.rejected",
    "leave.canceled",
    "leave.balance_read",
    "leave.accrual_settled"
  ]) {
    assert.ok(actions.includes(action), `expected audit action ${action}`);
  }

  for (const eventName of [
    "leave.requested.v1",
    "leave.approved.v1",
    "leave.rejected.v1",
    "leave.canceled.v1",
    "leave.accrual.settled.v1"
  ]) {
    assert.ok(
      getRuntimeMemoryDomainEvents().some((event) => event.name === eventName),
      `expected domain event ${eventName}`
    );
  }
}

run()
  .then(() => {
    console.log("e2e-wi0002-leave.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
