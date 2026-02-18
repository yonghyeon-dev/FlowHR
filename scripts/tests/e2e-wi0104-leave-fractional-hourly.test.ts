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
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const leaveCreateRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveApproveRoute = await import("../../src/app/api/leave/requests/[requestId]/approve/route.ts");
  const leavePolicyRoute = await import("../../src/app/api/leave/policy/route.ts");
  const leaveBalanceRoute = await import("../../src/app/api/leave/balances/[employeeId]/route.ts");

  resetMemoryDataAccess();

  const org = await memoryDataAccess.organizations.create({ name: "Org Leave Fractional" });
  const employeeId = "EMP-LEAVE-FRAC-1";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: org.id });

  const policySave = await leavePolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/leave/policy",
      {
        organizationId: org.id,
        annualGrantDays: 15,
        carryOverCapDays: 5,
        allowHalfDay: true,
        allowHourly: true,
        hourlyIncrementMinutes: 30,
        maxHoursPerRequest: 4
      },
      actorHeaders("payroll_operator", "PAY-1")
    )
  );
  assert.equal(policySave.status, 200, "policy save should succeed");

  const halfDayCreate = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        unit: "HALF_DAY",
        startDate: "2026-03-06T09:00:00+09:00",
        endDate: "2026-03-06T13:00:00+09:00",
        reason: "morning family care"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(halfDayCreate.status, 201);
  const halfDayBody = await readJson<{
    request: { id: string; unit: string; days: number; hours: number | null };
  }>(halfDayCreate);
  assert.equal(halfDayBody.request.unit, "HALF_DAY");
  assert.equal(halfDayBody.request.days, 0.5);
  assert.equal(halfDayBody.request.hours, 4);

  const halfDayApprove = await leaveApproveRoute.POST(
    new Request(`http://localhost/api/leave/requests/${halfDayBody.request.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1")
    }),
    { params: Promise.resolve({ requestId: halfDayBody.request.id }) } as RouteContext<{ requestId: string }>
  );
  assert.equal(halfDayApprove.status, 200);

  const hourlyCreate = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "SICK",
        unit: "HOUR",
        startDate: "2026-03-07T10:00:00+09:00",
        endDate: "2026-03-07T12:00:00+09:00",
        reason: "clinic"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(hourlyCreate.status, 201);
  const hourlyBody = await readJson<{
    request: { id: string; unit: string; days: number; hours: number | null };
  }>(hourlyCreate);
  assert.equal(hourlyBody.request.unit, "HOUR");
  assert.equal(hourlyBody.request.hours, 2);
  assert.equal(hourlyBody.request.days, 0.25);

  const hourlyApprove = await leaveApproveRoute.POST(
    new Request(`http://localhost/api/leave/requests/${hourlyBody.request.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1")
    }),
    { params: Promise.resolve({ requestId: hourlyBody.request.id }) } as RouteContext<{ requestId: string }>
  );
  assert.equal(hourlyApprove.status, 200);

  const balanceResponse = await leaveBalanceRoute.GET(
    new Request(`http://localhost/api/leave/balances/${employeeId}`, {
      method: "GET",
      headers: actorHeaders("payroll_operator", "PAY-1")
    }),
    { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(balanceResponse.status, 200);
  const balanceBody = await readJson<{
    balance: { grantedDays: number; usedDays: number; remainingDays: number };
  }>(balanceResponse);
  assert.equal(balanceBody.balance.grantedDays, 15);
  assert.equal(balanceBody.balance.usedDays, 0.75);
  assert.equal(balanceBody.balance.remainingDays, 14.25);

  const policyRestrictHourly = await leavePolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/leave/policy",
      {
        organizationId: org.id,
        annualGrantDays: 15,
        carryOverCapDays: 5,
        allowHalfDay: true,
        allowHourly: false,
        hourlyIncrementMinutes: 30,
        maxHoursPerRequest: 4
      },
      actorHeaders("payroll_operator", "PAY-1")
    )
  );
  assert.equal(policyRestrictHourly.status, 200);

  const hourlyDenied = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        unit: "HOUR",
        startDate: "2026-03-08T10:00:00+09:00",
        endDate: "2026-03-08T11:00:00+09:00"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(hourlyDenied.status, 409, "hourly request should be denied when policy disallows it");

  const policyRestrictHalfDay = await leavePolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/leave/policy",
      {
        organizationId: org.id,
        annualGrantDays: 15,
        carryOverCapDays: 5,
        allowHalfDay: false,
        allowHourly: false,
        hourlyIncrementMinutes: 30,
        maxHoursPerRequest: 4
      },
      actorHeaders("payroll_operator", "PAY-1")
    )
  );
  assert.equal(policyRestrictHalfDay.status, 200);

  const halfDayDenied = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        unit: "HALF_DAY",
        startDate: "2026-03-09T09:00:00+09:00",
        endDate: "2026-03-09T13:00:00+09:00"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(halfDayDenied.status, 409, "half-day request should be denied when policy disallows it");

  console.log("e2e-wi0104-leave-fractional-hourly.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
