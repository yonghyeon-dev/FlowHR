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

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
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
  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveBalanceRoute = await import("../../src/app/api/leave/balance/[employeeId]/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0949 Org" });
  const employeeOkId = "EMP-WI0949-OK";
  const employeePendingId = "EMP-WI0949-PENDING";
  const adminId = "ADM-WI0949-1";

  await memoryDataAccess.employees.create({ id: employeeOkId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: employeePendingId, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: adminId, organizationId: organization.id });

  const employeeOkHeaders = actorHeaders("employee", employeeOkId, organization.id);
  const employeePendingHeaders = actorHeaders("employee", employeePendingId, organization.id);
  const adminHeaders = actorHeaders("admin", adminId, organization.id);

  const sufficientResponse = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: employeeOkId,
        leaveType: "ANNUAL",
        startDate: "2026-06-01T00:00:00+09:00",
        endDate: "2026-06-05T23:59:59+09:00",
        reason: "vacation"
      },
      employeeOkHeaders
    )
  );
  assert.equal(sufficientResponse.status, 201, "request within balance should succeed");

  const exceedResponse = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: employeeOkId,
        leaveType: "ANNUAL",
        startDate: "2026-07-01T00:00:00+09:00",
        endDate: "2026-07-11T23:59:59+09:00",
        reason: "too long"
      },
      employeeOkHeaders
    )
  );
  assert.equal(exceedResponse.status, 400, "request exceeding balance should be rejected");
  const exceedBody = await readJson<{
    error: string;
    details: {
      currentBalance: number;
      requestedDays: number;
      total: number;
      used: number;
      pending: number;
    };
  }>(exceedResponse);
  assert.match(exceedBody.error, /insufficient leave balance/i);
  assert.equal(exceedBody.details.currentBalance, 10);
  assert.equal(exceedBody.details.requestedDays, 11);
  assert.equal(exceedBody.details.total, 15);
  assert.equal(exceedBody.details.used, 0);
  assert.equal(exceedBody.details.pending, 5);

  const firstPendingResponse = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: employeePendingId,
        leaveType: "ANNUAL",
        startDate: "2026-08-01T00:00:00+09:00",
        endDate: "2026-08-10T23:59:59+09:00",
        reason: "trip"
      },
      employeePendingHeaders
    )
  );
  assert.equal(firstPendingResponse.status, 201, "first pending request should succeed");

  const pendingConsumesResponse = await leaveRequestsRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/requests",
      {
        employeeId: employeePendingId,
        leaveType: "ANNUAL",
        startDate: "2026-09-01T00:00:00+09:00",
        endDate: "2026-09-06T23:59:59+09:00",
        reason: "double booking guard"
      },
      employeePendingHeaders
    )
  );
  assert.equal(
    pendingConsumesResponse.status,
    400,
    "request should be rejected when pending requests consume remaining balance"
  );
  const pendingConsumesBody = await readJson<{
    details: {
      currentBalance: number;
      requestedDays: number;
      total: number;
      used: number;
      pending: number;
    };
  }>(pendingConsumesResponse);
  assert.equal(pendingConsumesBody.details.currentBalance, 5);
  assert.equal(pendingConsumesBody.details.requestedDays, 6);
  assert.equal(pendingConsumesBody.details.total, 15);
  assert.equal(pendingConsumesBody.details.used, 0);
  assert.equal(pendingConsumesBody.details.pending, 10);

  const adminBalanceResponse = await leaveBalanceRoute.GET(
    new Request(
      `http://localhost/api/leave/balance/${employeePendingId}?leaveType=ANNUAL&year=2026`,
      {
        method: "GET",
        headers: adminHeaders
      }
    ),
    { params: Promise.resolve({ employeeId: employeePendingId }) } as RouteContext<{
      employeeId: string;
    }>
  );
  assert.equal(adminBalanceResponse.status, 200, "admin should read employee available balance");
  const adminBalanceBody = await readJson<{
    employeeId: string;
    leaveType: string;
    year: number;
    balance: {
      total: number;
      used: number;
      pending: number;
      available: number;
    };
  }>(adminBalanceResponse);
  assert.equal(adminBalanceBody.employeeId, employeePendingId);
  assert.equal(adminBalanceBody.leaveType, "ANNUAL");
  assert.equal(adminBalanceBody.year, 2026);
  assert.deepEqual(adminBalanceBody.balance, {
    total: 15,
    used: 0,
    pending: 10,
    available: 5
  });

  const ownBalanceResponse = await leaveBalanceRoute.GET(
    new Request(
      `http://localhost/api/leave/balance/${employeePendingId}?leaveType=ANNUAL&year=2026`,
      {
        method: "GET",
        headers: employeePendingHeaders
      }
    ),
    { params: Promise.resolve({ employeeId: employeePendingId }) } as RouteContext<{
      employeeId: string;
    }>
  );
  assert.equal(ownBalanceResponse.status, 200, "employee should read own available balance");
  const ownBalanceBody = await readJson<{
    balance: {
      total: number;
      used: number;
      pending: number;
      available: number;
    };
  }>(ownBalanceResponse);
  assert.deepEqual(ownBalanceBody.balance, {
    total: 15,
    used: 0,
    pending: 10,
    available: 5
  });
}

run()
  .then(() => {
    console.log("e2e-wi0949-leave-balance-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
