import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_WEBHOOK_URL = "";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_DISCORD_WEBHOOK = "";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_SLACK_WEBHOOK = "";
runtimeEnv.FLOWHR_ALERT_WEBHOOK_URL = "";
runtimeEnv.FLOWHR_ALERT_DISCORD_WEBHOOK = "";
runtimeEnv.FLOWHR_ALERT_SLACK_WEBHOOK = "";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL = "";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_TOKEN = "";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_FROM = "";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID = "";
runtimeEnv.FLOWHR_ALERT_EMAIL_TEMPLATE_URL = "";
runtimeEnv.FLOWHR_ALERT_EMAIL_TEMPLATE_TOKEN = "";
runtimeEnv.FLOWHR_ALERT_EMAIL_FROM = "";

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

type CapturedRequest = {
  method: string;
  body: string;
  authorization: string | null;
  statusCode: number;
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

async function startFailOnceEmailTemplateServer() {
  let callCount = 0;
  const capturedRequests: CapturedRequest[] = [];
  const server = http.createServer(async (request, response) => {
    callCount += 1;
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }

    const statusCode = callCount === 1 ? 500 : 200;
    capturedRequests.push({
      method: request.method ?? "UNKNOWN",
      body: Buffer.concat(chunks).toString("utf8"),
      authorization: request.headers.authorization ?? null,
      statusCode
    });
    response.statusCode = statusCode;
    response.end(statusCode === 200 ? "ok" : "failed");
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to resolve email template server address");
  }

  return {
    endpointUrl: `http://127.0.0.1:${address.port}/email-template`,
    capturedRequests,
    async close() {
      server.close();
      await once(server, "close");
    }
  };
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
  const leavePolicyRoute = await import("../../src/app/api/leave/policy/route.ts");
  const leavePromotionNotifyRoute = await import(
    "../../src/app/api/leave/policy/promotion-notify/route.ts"
  );
  const leavePromotionDeliveriesRoute = await import(
    "../../src/app/api/leave/policy/promotion-deliveries/route.ts"
  );
  const leavePromotionDeliveryDetailRoute = await import(
    "../../src/app/api/leave/policy/promotion-deliveries/[deliveryId]/route.ts"
  );
  const leavePromotionDeliveryRetryRoute = await import(
    "../../src/app/api/leave/policy/promotion-deliveries/[deliveryId]/retry/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Leave Promotion Delivery History Retry"
  });
  const employeeA = "EMP-PROMO-RETRY-001";
  const employeeB = "EMP-PROMO-RETRY-002";
  const employeeNoEmail = "EMP-PROMO-RETRY-003";
  await memoryDataAccess.employees.create({
    id: employeeA,
    organizationId: organization.id,
    name: "Retry Employee A",
    email: "retry-a@example.com"
  });
  await memoryDataAccess.employees.create({
    id: employeeB,
    organizationId: organization.id,
    name: "Retry Employee B",
    email: "retry-b@example.com"
  });
  await memoryDataAccess.employees.create({
    id: employeeNoEmail,
    organizationId: organization.id,
    name: "Retry Employee No Email",
    email: null
  });

  await memoryDataAccess.leaveBalance.ensure(employeeA, 15);
  await memoryDataAccess.leaveBalance.ensure(employeeB, 15);
  await memoryDataAccess.leaveBalance.ensure(employeeNoEmail, 15);
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeA,
    usedDaysDelta: 8,
    defaultGrantedDays: 15
  });
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeB,
    usedDaysDelta: 9,
    defaultGrantedDays: 15
  });
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeNoEmail,
    usedDaysDelta: 7,
    defaultGrantedDays: 15
  });

  const savePolicyResponse = await leavePolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/leave/policy",
      {
        organizationId: organization.id,
        annualGrantDays: 15,
        carryOverCapDays: 5,
        allowHalfDay: true,
        allowHourly: true,
        hourlyIncrementMinutes: 30,
        maxHoursPerRequest: 8,
        minNoticeDays: 0,
        maxConsecutiveDays: null,
        annualLeavePromotionEnabled: true,
        annualLeavePromotionThresholdDays: 5,
        annualLeavePromotionLeadDays: 30,
        annualLeavePromotionMessageTemplate:
          "Promotion {year}: threshold {thresholdDays}, targets {targetCount}, window {noticeWindowStart}~{noticeWindowEnd}"
      },
      actorHeaders("payroll_operator", "PAY-1250", organization.id)
    )
  );
  assert.equal(savePolicyResponse.status, 200, "leave policy save should succeed");

  const emailTemplateServer = await startFailOnceEmailTemplateServer();
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL = emailTemplateServer.endpointUrl;
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_TOKEN = "retry-email-template-token";
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_FROM = "no-reply@flowhr.local";
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID = "leave-promotion-template-v1";

  try {
    const failedDispatchResponse = await leavePromotionNotifyRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/policy/promotion-notify",
        {
          organizationId: organization.id,
          asOf: "2026-12-15T00:00:00.000Z",
          includeUpcoming: false,
          dryRun: false,
          deliveryChannel: "email_template"
        },
        actorHeaders("payroll_operator", "PAY-1250", organization.id)
      )
    );
    assert.equal(
      failedDispatchResponse.status,
      502,
      "initial dispatch should fail when email endpoint returns 500"
    );
    assert.equal(
      emailTemplateServer.capturedRequests.length,
      1,
      "failed initial dispatch should still call email endpoint once"
    );

    const listFailedResponse = await leavePromotionDeliveriesRoute.GET(
      new Request(
        `http://localhost/api/leave/policy/promotion-deliveries?organizationId=${encodeURIComponent(
          organization.id
        )}&channel=email_template&status=failed&limit=20`,
        {
          method: "GET",
          headers: actorHeaders("payroll_operator", "PAY-1250", organization.id)
        }
      )
    );
    assert.equal(listFailedResponse.status, 200, "delivery history list should succeed");
    const listFailedBody = await readJson<{
      deliveries: Array<{ id: string; status: string; channel: string }>;
    }>(listFailedResponse);
    assert.ok(listFailedBody.deliveries.length > 0, "failed delivery should be listed");
    const sourceDeliveryId = listFailedBody.deliveries[0].id;
    assert.equal(listFailedBody.deliveries[0].status, "failed");
    assert.equal(listFailedBody.deliveries[0].channel, "email_template");

    const detailResponse = await leavePromotionDeliveryDetailRoute.GET(
      new Request(
        `http://localhost/api/leave/policy/promotion-deliveries/${sourceDeliveryId}?organizationId=${encodeURIComponent(
          organization.id
        )}`,
        {
          method: "GET",
          headers: actorHeaders("payroll_operator", "PAY-1250", organization.id)
        }
      ),
      {
        params: Promise.resolve({ deliveryId: sourceDeliveryId })
      } as RouteContext<{ deliveryId: string }>
    );
    assert.equal(detailResponse.status, 200, "delivery detail should succeed");
    const detailBody = await readJson<{
      delivery: { id: string; status: string };
      recipients: Array<{ employeeId: string; status: string; retryCount: number }>;
    }>(detailResponse);
    assert.equal(detailBody.delivery.id, sourceDeliveryId);
    assert.equal(detailBody.delivery.status, "failed");
    assert.equal(
      detailBody.recipients.filter((recipient) => recipient.status === "FAILED").length,
      2,
      "two recipients with email should be failed"
    );
    assert.equal(
      detailBody.recipients.filter((recipient) => recipient.status === "SKIPPED_NO_EMAIL").length,
      1,
      "recipient without email should be skipped"
    );

    const retryDryRunResponse = await leavePromotionDeliveryRetryRoute.POST(
      jsonRequest(
        "POST",
        `/api/leave/policy/promotion-deliveries/${sourceDeliveryId}/retry`,
        {
          organizationId: organization.id,
          dryRun: true
        },
        actorHeaders("payroll_operator", "PAY-1250", organization.id)
      ),
      {
        params: Promise.resolve({ deliveryId: sourceDeliveryId })
      } as RouteContext<{ deliveryId: string }>
    );
    assert.equal(retryDryRunResponse.status, 200, "retry dry-run should succeed");
    const retryDryRunBody = await readJson<{
      delivery: { id: string; status: string; attempted: boolean; sentTargetCount: number };
      recipients: Array<{ status: string }>;
    }>(retryDryRunResponse);
    const retryDryRunDeliveryId = retryDryRunBody.delivery.id;
    assert.equal(retryDryRunBody.delivery.status, "dry_run");
    assert.equal(retryDryRunBody.delivery.attempted, false);
    assert.equal(retryDryRunBody.delivery.sentTargetCount, 0);
    assert.equal(
      retryDryRunBody.recipients.filter((recipient) => recipient.status === "PENDING").length,
      2,
      "dry-run retry recipients should stay pending"
    );
    assert.equal(
      emailTemplateServer.capturedRequests.length,
      1,
      "retry dry-run should not call email endpoint"
    );

    const retryDispatchResponse = await leavePromotionDeliveryRetryRoute.POST(
      jsonRequest(
        "POST",
        `/api/leave/policy/promotion-deliveries/${sourceDeliveryId}/retry`,
        {
          organizationId: organization.id,
          dryRun: false
        },
        actorHeaders("payroll_operator", "PAY-1250", organization.id)
      ),
      {
        params: Promise.resolve({ deliveryId: sourceDeliveryId })
      } as RouteContext<{ deliveryId: string }>
    );
    assert.equal(retryDispatchResponse.status, 200, "retry dispatch should succeed");
    const retryDispatchBody = await readJson<{
      delivery: {
        id: string;
        status: string;
        attempted: boolean;
        sentTargetCount: number;
        recipientCount: number;
      };
      recipients: Array<{ employeeId: string; status: string; retryCount: number }>;
      retries: Array<{ id: string }>;
    }>(retryDispatchResponse);
    const retryDispatchedDeliveryId = retryDispatchBody.delivery.id;
    assert.equal(retryDispatchBody.delivery.status, "dispatched");
    assert.equal(retryDispatchBody.delivery.attempted, true);
    assert.equal(retryDispatchBody.delivery.sentTargetCount, 2);
    assert.equal(retryDispatchBody.delivery.recipientCount, 2);
    assert.equal(
      retryDispatchBody.recipients.filter((recipient) => recipient.status === "SENT").length,
      2,
      "retry dispatch should send to failed recipients with email"
    );
    assert.equal(
      retryDispatchBody.recipients.every((recipient) => recipient.retryCount === 1),
      true,
      "first retry records retryCount=1"
    );
    assert.equal(
      emailTemplateServer.capturedRequests.length,
      2,
      "retry dispatch should call email endpoint once"
    );

    const retriedPayload = JSON.parse(emailTemplateServer.capturedRequests[1].body) as {
      templateId: string;
      from: string;
      recipients: Array<{ employeeId: string; email: string }>;
    };
    assert.equal(emailTemplateServer.capturedRequests[1].authorization, "Bearer retry-email-template-token");
    assert.equal(retriedPayload.templateId, "leave-promotion-template-v1");
    assert.equal(retriedPayload.from, "no-reply@flowhr.local");
    assert.equal(retriedPayload.recipients.length, 2);
    assert.ok(
      retriedPayload.recipients.some((recipient) => recipient.employeeId === employeeA),
      "retry payload should include employee A"
    );
    assert.ok(
      retriedPayload.recipients.some((recipient) => recipient.employeeId === employeeB),
      "retry payload should include employee B"
    );
    assert.ok(
      retriedPayload.recipients.every((recipient) => recipient.employeeId !== employeeNoEmail),
      "retry payload should exclude recipients without email"
    );

    const detailAfterRetryResponse = await leavePromotionDeliveryDetailRoute.GET(
      new Request(
        `http://localhost/api/leave/policy/promotion-deliveries/${sourceDeliveryId}?organizationId=${encodeURIComponent(
          organization.id
        )}`,
        {
          method: "GET",
          headers: actorHeaders("payroll_operator", "PAY-1250", organization.id)
        }
      ),
      {
        params: Promise.resolve({ deliveryId: sourceDeliveryId })
      } as RouteContext<{ deliveryId: string }>
    );
    assert.equal(detailAfterRetryResponse.status, 200, "source delivery detail should remain readable");
    const detailAfterRetryBody = await readJson<{
      retries: Array<{ id: string }>;
    }>(detailAfterRetryResponse);
    assert.ok(
      detailAfterRetryBody.retries.some((item) => item.id === retryDryRunDeliveryId),
      "source detail should include dry-run retry"
    );
    assert.ok(
      detailAfterRetryBody.retries.some((item) => item.id === retryDispatchedDeliveryId),
      "source detail should include dispatched retry"
    );

    const listRetriesResponse = await leavePromotionDeliveriesRoute.GET(
      new Request(
        `http://localhost/api/leave/policy/promotion-deliveries?organizationId=${encodeURIComponent(
          organization.id
        )}&retryOfDeliveryId=${encodeURIComponent(sourceDeliveryId)}&limit=20`,
        {
          method: "GET",
          headers: actorHeaders("payroll_operator", "PAY-1250", organization.id)
        }
      )
    );
    assert.equal(listRetriesResponse.status, 200, "retry-chain list should succeed");
    const listRetriesBody = await readJson<{
      deliveries: Array<{ id: string }>;
    }>(listRetriesResponse);
    assert.ok(
      listRetriesBody.deliveries.some((item) => item.id === retryDryRunDeliveryId),
      "retry-chain list should include dry-run retry"
    );
    assert.ok(
      listRetriesBody.deliveries.some((item) => item.id === retryDispatchedDeliveryId),
      "retry-chain list should include dispatched retry"
    );
  } finally {
    await emailTemplateServer.close();
  }

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(
    eventNames.includes("leave.promotion.notice.dispatched.v1"),
    "retry dispatched delivery should publish leave.promotion.notice.dispatched.v1"
  );

  console.log("e2e-wi0125-leave-promotion-delivery-history-retry.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
