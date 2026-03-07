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

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

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

function toSeoulIso(daysFromToday: number, hour = 9, minute = 0) {
  const now = new Date();
  const seoulNow = new Date(now.getTime() + SEOUL_OFFSET_MS);
  const year = seoulNow.getUTCFullYear();
  const month = seoulNow.getUTCMonth();
  const day = seoulNow.getUTCDate() + daysFromToday;
  const utcHour = hour - 9;
  return new Date(Date.UTC(year, month, day, utcHour, minute, 0)).toISOString();
}

function toSeoulIsoForNextWeekday(
  targetDayOfWeek: number,
  options?: { weekOffset?: number; hour?: number; minute?: number }
) {
  const { weekOffset = 0, hour = 9, minute = 0 } = options ?? {};
  const now = new Date();
  const seoulNow = new Date(now.getTime() + SEOUL_OFFSET_MS);
  const year = seoulNow.getUTCFullYear();
  const month = seoulNow.getUTCMonth();
  const day = seoulNow.getUTCDate();
  const todayDayOfWeek = seoulNow.getUTCDay();
  let daysUntilTarget = (targetDayOfWeek - todayDayOfWeek + 7) % 7;
  if (daysUntilTarget === 0) {
    daysUntilTarget = 7;
  }
  daysUntilTarget += weekOffset * 7;
  const utcHour = hour - 9;
  return new Date(Date.UTC(year, month, day + daysUntilTarget, utcHour, minute, 0)).toISOString();
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const leaveCreateRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveApproveRoute = await import("../../src/app/api/leave/requests/[requestId]/approve/route.ts");
  const leaveBalanceRoute = await import("../../src/app/api/leave/balances/[employeeId]/route.ts");
  const leavePolicyRoute = await import("../../src/app/api/leave/policy/route.ts");

  resetMemoryDataAccess();

  const org = await memoryDataAccess.organizations.create({ name: "Org Leave Notice Cap" });
  const employeeId = "EMP-LEAVE-NOTICE-1";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: org.id });

  const savePolicyResponse = await leavePolicyRoute.PUT(
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
        maxHoursPerRequest: 8,
        minNoticeDays: 2,
        maxConsecutiveDays: 3
      },
      actorHeaders("payroll_operator", "PAY-1")
    )
  );
  assert.equal(savePolicyResponse.status, 200, "leave policy save should succeed");

  const readPolicyResponse = await leavePolicyRoute.GET(
    new Request(`http://localhost/api/leave/policy?organizationId=${org.id}`, {
      method: "GET",
      headers: actorHeaders("payroll_operator", "PAY-1")
    })
  );
  assert.equal(readPolicyResponse.status, 200, "leave policy read should succeed");
  const readPolicyBody = await readJson<{
    policy: { minNoticeDays: number; maxConsecutiveDays: number | null };
  }>(readPolicyResponse);
  assert.equal(readPolicyBody.policy.minNoticeDays, 2);
  assert.equal(readPolicyBody.policy.maxConsecutiveDays, 3);

  const noticeDeniedResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        unit: "FULL_DAY",
        startDate: toSeoulIso(1, 9, 0),
        endDate: toSeoulIso(1, 18, 0),
        reason: "notice should fail"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(noticeDeniedResponse.status, 409, "request should fail min notice policy");

  const capDeniedResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        unit: "FULL_DAY",
        startDate: toSeoulIsoForNextWeekday(1, { weekOffset: 1, hour: 9, minute: 0 }),
        endDate: toSeoulIsoForNextWeekday(4, { weekOffset: 1, hour: 18, minute: 0 }),
        reason: "consecutive cap should fail"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(capDeniedResponse.status, 409, "request should fail max consecutive policy");

  const allowedCreateResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        unit: "FULL_DAY",
        startDate: toSeoulIsoForNextWeekday(1, { weekOffset: 1, hour: 9, minute: 0 }),
        endDate: toSeoulIsoForNextWeekday(3, { weekOffset: 1, hour: 18, minute: 0 }),
        reason: "within policy"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(allowedCreateResponse.status, 201, "request should pass within policy");
  const allowedCreateBody = await readJson<{ request: { id: string; days: number } }>(allowedCreateResponse);
  assert.equal(allowedCreateBody.request.days, 3);

  const approveResponse = await leaveApproveRoute.POST(
    new Request(`http://localhost/api/leave/requests/${allowedCreateBody.request.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-1")
    }),
    { params: Promise.resolve({ requestId: allowedCreateBody.request.id }) } as RouteContext<{
      requestId: string;
    }>
  );
  assert.equal(approveResponse.status, 200, "manager approval should succeed");

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
  assert.equal(balanceBody.balance.usedDays, 3);
  assert.equal(balanceBody.balance.remainingDays, 12);

  const clearCapResponse = await leavePolicyRoute.PUT(
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
        maxHoursPerRequest: 8,
        minNoticeDays: 2,
        maxConsecutiveDays: null
      },
      actorHeaders("payroll_operator", "PAY-1")
    )
  );
  assert.equal(clearCapResponse.status, 200, "policy should support null maxConsecutiveDays");

  const longLeaveAllowedResponse = await leaveCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId,
        leaveType: "ANNUAL",
        unit: "FULL_DAY",
        startDate: toSeoulIsoForNextWeekday(1, { weekOffset: 3, hour: 9, minute: 0 }),
        endDate: toSeoulIsoForNextWeekday(5, { weekOffset: 3, hour: 18, minute: 0 }),
        reason: "cap cleared"
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(longLeaveAllowedResponse.status, 201, "request should pass after clearing consecutive cap");

  console.log("e2e-wi0114-leave-notice-consecutive-policy.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
