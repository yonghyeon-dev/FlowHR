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

function jsonRequest(method: string, urlPath: string, payload: unknown, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
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
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
  const previewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const confirmRoute = await import("../../src/app/api/payroll/runs/[runId]/confirm/route.ts");
  const distributeRoute = await import("../../src/app/api/payroll/payslips/distribute/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();
  runtimeEnv.FLOWHR_PAYROLL_PAYSLIP_DELIVERY_V1 = "true";

  const organization = await memoryDataAccess.organizations.create({
    name: "Org WI-0914 Payslip Notification"
  });
  const employees = ["EMP-WI0914-1001", "EMP-WI0914-1002"];
  for (const employeeId of employees) {
    await memoryDataAccess.employees.create({
      id: employeeId,
      organizationId: organization.id,
      name: employeeId
    });
  }

  const periodStartIso = "2026-04-01T00:00:00+09:00";
  const periodEndIso = "2026-04-30T23:59:59+09:00";
  const payrollOperatorId = "PAY-WI0914-1001";

  const runIds: string[] = [];
  for (const employeeId of employees) {
    const previewResponse = await previewRoute.POST(
      jsonRequest(
        "POST",
        "/api/payroll/runs/preview",
        {
          periodStart: periodStartIso,
          periodEnd: periodEndIso,
          employeeId,
          hourlyRateKrw: 12000
        },
        actorHeaders("payroll_operator", payrollOperatorId, organization.id)
      )
    );
    assert.equal(previewResponse.status, 200, "preview should succeed");
    const previewBody = await readJson<{ run: { id: string } }>(previewResponse);
    runIds.push(previewBody.run.id);
  }

  for (const runId of runIds) {
    const confirmResponse = await confirmRoute.POST(
      new Request(`http://localhost/api/payroll/runs/${runId}/confirm`, {
        method: "POST",
        headers: actorHeaders("payroll_operator", payrollOperatorId, organization.id)
      }),
      { params: Promise.resolve({ runId }) } as RouteContext<{ runId: string }>
    );
    assert.equal(confirmResponse.status, 200, "confirm should succeed");
  }

  const distributeResponse = await distributeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/payslips/distribute",
      {
        periodStart: periodStartIso,
        periodEnd: periodEndIso,
        deliveryChannel: "in_app",
        dryRun: false
      },
      actorHeaders("payroll_operator", payrollOperatorId, organization.id)
    )
  );
  assert.equal(distributeResponse.status, 200, "distribute should succeed");
  const distributeBody = await readJson<{
    summary: {
      distribution: {
        targetCount: number;
        newlyDistributedCount: number;
      };
    };
  }>(distributeResponse);
  assert.equal(distributeBody.summary.distribution.targetCount, 2);
  assert.equal(distributeBody.summary.distribution.newlyDistributedCount, 2);

  const distributedEvent = getRuntimeMemoryDomainEvents().find(
    (event) => event.name === "payroll.payslip.distributed.v1"
  );
  assert.ok(distributedEvent, "payroll payslip distributed event should be published");
  assert.deepEqual(
    [...new Set(((distributedEvent?.payload?.employeeIds as string[] | undefined) ?? []).sort())],
    [...employees].sort(),
    "event payload should include distributed employeeIds"
  );

  const notifications = await memoryDataAccess.noticeNotifications.list({
    organizationId: organization.id,
    state: "QUEUED"
  });
  assert.equal(notifications.length, 2, "queue should contain employee-targeted in-app notifications");
  assert.ok(
    notifications.every((notification) => notification.employeeId === null),
    "notice queue entity should stay schema-aligned (no employeeId column)"
  );

  for (const notification of notifications) {
    assert.equal(notification.channel, "in_app");
    assert.equal(notification.state, "QUEUED");

    const notice = await memoryDataAccess.notices.findById(notification.noticeId);
    assert.ok(notice, "auto notice should exist");
    assert.equal(notice?.title, "급여명세서 도착");
    assert.equal(notice?.body, "2026년 04월 급여명세서가 발행되었습니다.");
  }

  const distributeAgainResponse = await distributeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/payslips/distribute",
      {
        periodStart: periodStartIso,
        periodEnd: periodEndIso,
        deliveryChannel: "in_app",
        dryRun: false
      },
      actorHeaders("payroll_operator", payrollOperatorId, organization.id)
    )
  );
  assert.equal(distributeAgainResponse.status, 200, "re-distribute should be idempotent");
  const distributeAgainBody = await readJson<{
    summary: {
      distribution: {
        newlyDistributedCount: number;
      };
    };
  }>(distributeAgainResponse);
  assert.equal(distributeAgainBody.summary.distribution.newlyDistributedCount, 0);

  const notificationsAfterRedistribute = await memoryDataAccess.noticeNotifications.list({
    organizationId: organization.id,
    state: "QUEUED"
  });
  assert.equal(notificationsAfterRedistribute.length, 2, "idempotent distribute should not enqueue duplicates");
}

run()
  .then(() => {
    console.log("e2e-wi0914-payslip-notification.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
