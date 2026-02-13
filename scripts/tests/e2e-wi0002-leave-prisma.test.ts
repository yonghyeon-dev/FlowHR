import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "prisma";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";

if (!runtimeEnv.DATABASE_URL || !runtimeEnv.DIRECT_URL) {
  console.error("DATABASE_URL and DIRECT_URL are required for Prisma leave e2e test.");
  process.exit(1);
}

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
  const startedAt = new Date();
  const suffix = `${Date.now()}`;
  const employeeId = `E2E-LEAVE-EMP-${suffix}`;
  const otherEmployeeId = `E2E-LEAVE-EMP2-${suffix}`;
  const thirdEmployeeId = `E2E-LEAVE-EMP3-${suffix}`;
  const managerId = `E2E-LEAVE-MGR-${suffix}`;
  const payrollOperatorId = `E2E-LEAVE-PAY-${suffix}`;

  const { prisma } = await import("../../src/lib/prisma.ts");
  const leaveCreateRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveUpdateRoute = await import("../../src/app/api/leave/requests/[requestId]/route.ts");
  const leaveApproveRoute = await import(
    "../../src/app/api/leave/requests/[requestId]/approve/route.ts"
  );
  const leaveRejectRoute = await import("../../src/app/api/leave/requests/[requestId]/reject/route.ts");
  const leaveCancelRoute = await import("../../src/app/api/leave/requests/[requestId]/cancel/route.ts");
  const leaveBalanceRoute = await import("../../src/app/api/leave/balances/[employeeId]/route.ts");

  try {
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
    assert.equal(createResponse.status, 201, "leave create should succeed");
    const createBody = await readJson<{ request: { id: string; state: string; days: number } }>(
      createResponse
    );
    assert.equal(createBody.request.state, "PENDING");
    assert.equal(createBody.request.days, 2);

    const updateResponse = await leaveUpdateRoute.PATCH(
      jsonRequest(
        "PATCH",
        `/api/leave/requests/${createBody.request.id}`,
        {
          reason: "family trip"
        },
        actorHeaders("employee", employeeId)
      ),
      { params: Promise.resolve({ requestId: createBody.request.id }) } as RouteContext<{
        requestId: string;
      }>
    );
    assert.equal(updateResponse.status, 200, "leave update should succeed");

    const approveResponse = await leaveApproveRoute.POST(
      new Request(`http://localhost/api/leave/requests/${createBody.request.id}/approve`, {
        method: "POST",
        headers: actorHeaders("manager", managerId)
      }),
      { params: Promise.resolve({ requestId: createBody.request.id }) } as RouteContext<{
        requestId: string;
      }>
    );
    assert.equal(approveResponse.status, 200, "leave approve should succeed");
    const approveBody = await readJson<{
      request: { state: string };
      balance: { usedDays: number; remainingDays: number };
    }>(approveResponse);
    assert.equal(approveBody.request.state, "APPROVED");
    assert.equal(approveBody.balance.usedDays, 2);
    assert.equal(approveBody.balance.remainingDays, 13);

    const balanceResponse = await leaveBalanceRoute.GET(
      new Request(`http://localhost/api/leave/balances/${employeeId}`, {
        method: "GET",
        headers: actorHeaders("payroll_operator", payrollOperatorId)
      }),
      { params: Promise.resolve({ employeeId }) } as RouteContext<{ employeeId: string }>
    );
    assert.equal(balanceResponse.status, 200, "payroll operator should read balance");
    const balanceBody = await readJson<{ balance: { usedDays: number; remainingDays: number } }>(
      balanceResponse
    );
    assert.equal(balanceBody.balance.usedDays, 2);
    assert.equal(balanceBody.balance.remainingDays, 13);

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
          reason: "insufficient coverage"
        },
        actorHeaders("manager", managerId)
      ),
      {
        params: Promise.resolve({ requestId: rejectCreateBody.request.id })
      } as RouteContext<{ requestId: string }>
    );
    assert.equal(rejectResponse.status, 200, "leave reject should succeed");

    const cancelCreateResponse = await leaveCreateRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/requests",
        {
          employeeId: thirdEmployeeId,
          leaveType: "UNPAID",
          startDate: "2026-03-12T00:00:00+09:00",
          endDate: "2026-03-12T23:59:59+09:00"
        },
        actorHeaders("employee", thirdEmployeeId)
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
        actorHeaders("employee", thirdEmployeeId)
      ),
      {
        params: Promise.resolve({ requestId: cancelCreateBody.request.id })
      } as RouteContext<{ requestId: string }>
    );
    assert.equal(cancelResponse.status, 200, "leave cancel should succeed");

    const auditActions = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: startedAt },
        actorId: { in: [employeeId, otherEmployeeId, thirdEmployeeId, managerId, payrollOperatorId] }
      },
      orderBy: { createdAt: "asc" },
      select: { action: true }
    });

    for (const action of [
      "leave.requested",
      "leave.updated",
      "leave.approved",
      "leave.rejected",
      "leave.canceled",
      "leave.balance_read"
    ]) {
      assert.ok(
        auditActions.some((entry: { action: string }) => entry.action === action),
        `expected audit action ${action}`
      );
    }
  } finally {
    await prisma.auditLog.deleteMany({
      where: {
        createdAt: { gte: startedAt },
        actorId: { in: [employeeId, otherEmployeeId, thirdEmployeeId, managerId, payrollOperatorId] }
      }
    });
    await prisma.leaveApproval.deleteMany({
      where: {
        request: {
          employeeId: {
            in: [employeeId, otherEmployeeId, thirdEmployeeId]
          }
        }
      }
    });
    await prisma.leaveRequest.deleteMany({
      where: {
        employeeId: {
          in: [employeeId, otherEmployeeId, thirdEmployeeId]
        }
      }
    });
    await prisma.leaveBalanceProjection.deleteMany({
      where: {
        employeeId: {
          in: [employeeId, otherEmployeeId, thirdEmployeeId]
        }
      }
    });
    await prisma.$disconnect();
  }
}

run()
  .then(() => {
    console.log("e2e-wi0002-leave-prisma.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
