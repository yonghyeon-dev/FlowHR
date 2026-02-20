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

type CapturedRequest = {
  method: string;
  body: string;
  authorization: string | null;
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

async function startEmailTemplateServer() {
  const capturedRequests: CapturedRequest[] = [];
  const server = http.createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }
    capturedRequests.push({
      method: request.method ?? "UNKNOWN",
      body: Buffer.concat(chunks).toString("utf8"),
      authorization: request.headers.authorization ?? null
    });
    response.statusCode = 200;
    response.end("ok");
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

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const organization = await memoryDataAccess.organizations.create({ name: "Org Leave Promotion Email Template" });
  const employeeWithEmail = "EMP-EMAIL-TEMPLATE-001";
  const employeeWithoutEmail = "EMP-EMAIL-TEMPLATE-002";
  await memoryDataAccess.employees.create({
    id: employeeWithEmail,
    organizationId: organization.id,
    name: "Template Employee A",
    email: "template-a@example.com"
  });
  await memoryDataAccess.employees.create({
    id: employeeWithoutEmail,
    organizationId: organization.id,
    name: "Template Employee B",
    email: null
  });

  await memoryDataAccess.leaveBalance.ensure(employeeWithEmail, 15);
  await memoryDataAccess.leaveBalance.ensure(employeeWithoutEmail, 15);
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeWithEmail,
    usedDaysDelta: 8,
    defaultGrantedDays: 15
  });
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeWithoutEmail,
    usedDaysDelta: 9,
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
      actorHeaders("payroll_operator", "PAY-1240", organization.id)
    )
  );
  assert.equal(savePolicyResponse.status, 200, "leave policy save should succeed");

  const emailTemplateServer = await startEmailTemplateServer();
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL = emailTemplateServer.endpointUrl;
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_TOKEN = "test-email-template-token";
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_FROM = "no-reply@flowhr.local";
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID = "leave-promotion-template-v1";

  try {
    const dryRunResponse = await leavePromotionNotifyRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/policy/promotion-notify",
        {
          organizationId: organization.id,
          asOf: "2026-12-15T00:00:00.000Z",
          includeUpcoming: false,
          dryRun: true,
          deliveryChannel: "email_template"
        },
        actorHeaders("payroll_operator", "PAY-1240", organization.id)
      )
    );
    assert.equal(dryRunResponse.status, 200, "email-template dry-run should succeed");
    const dryRunBody = await readJson<{
      summary: { displayTargetCount: number; sentTargetCount: number };
      delivery: {
        status: string;
        channel: string;
        attempted: boolean;
        dryRun: boolean;
        recipientCount: number;
        missingEmailCount: number;
      };
    }>(dryRunResponse);
    assert.equal(dryRunBody.delivery.status, "dry_run");
    assert.equal(dryRunBody.delivery.channel, "email_template");
    assert.equal(dryRunBody.delivery.attempted, false);
    assert.equal(dryRunBody.delivery.dryRun, true);
    assert.equal(dryRunBody.delivery.recipientCount, 1);
    assert.equal(dryRunBody.delivery.missingEmailCount, 1);
    assert.equal(dryRunBody.summary.displayTargetCount, 2);
    assert.equal(dryRunBody.summary.sentTargetCount, 0);
    assert.equal(emailTemplateServer.capturedRequests.length, 0, "dry-run must not call email endpoint");

    const dispatchResponse = await leavePromotionNotifyRoute.POST(
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
        actorHeaders("payroll_operator", "PAY-1240", organization.id)
      )
    );
    assert.equal(dispatchResponse.status, 200, "email-template dispatch should succeed");
    const dispatchBody = await readJson<{
      summary: { displayTargetCount: number; sentTargetCount: number };
      delivery: {
        status: string;
        channel: string;
        attempted: boolean;
        provider: string | null;
        emailTemplateConfigured: boolean;
        emailTemplateId: string | null;
        recipientCount: number;
        missingEmailCount: number;
      };
    }>(dispatchResponse);
    assert.equal(dispatchBody.delivery.status, "dispatched");
    assert.equal(dispatchBody.delivery.channel, "email_template");
    assert.equal(dispatchBody.delivery.attempted, true);
    assert.equal(dispatchBody.delivery.provider, "email_template");
    assert.equal(dispatchBody.delivery.emailTemplateConfigured, true);
    assert.equal(dispatchBody.delivery.emailTemplateId, "leave-promotion-template-v1");
    assert.equal(dispatchBody.delivery.recipientCount, 1);
    assert.equal(dispatchBody.delivery.missingEmailCount, 1);
    assert.equal(dispatchBody.summary.displayTargetCount, 2);
    assert.equal(dispatchBody.summary.sentTargetCount, 1);
    assert.equal(emailTemplateServer.capturedRequests.length, 1, "dispatch should call email endpoint once");

    const dispatchedPayload = JSON.parse(emailTemplateServer.capturedRequests[0].body) as {
      templateId: string;
      from: string;
      recipients: Array<{ employeeId: string; email: string }>;
      subject: string;
    };
    assert.equal(emailTemplateServer.capturedRequests[0].authorization, "Bearer test-email-template-token");
    assert.equal(dispatchedPayload.templateId, "leave-promotion-template-v1");
    assert.equal(dispatchedPayload.from, "no-reply@flowhr.local");
    assert.equal(dispatchedPayload.recipients.length, 1);
    assert.equal(dispatchedPayload.recipients[0].employeeId, employeeWithEmail);
    assert.equal(dispatchedPayload.recipients[0].email, "template-a@example.com");
    assert.match(dispatchedPayload.subject, /Annual leave promotion notice/);

    runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL = "";
    runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_FROM = "";
    const missingConfigResponse = await leavePromotionNotifyRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/policy/promotion-notify",
        {
          organizationId: organization.id,
          asOf: "2026-12-15T00:00:00.000Z",
          includeUpcoming: false,
          dryRun: false,
          deliveryChannel: "email_template",
          emailTemplateId: "manual-template-id"
        },
        actorHeaders("payroll_operator", "PAY-1240", organization.id)
      )
    );
    assert.equal(
      missingConfigResponse.status,
      503,
      "email-template dispatch should fail when endpoint/from config is missing"
    );

    runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_URL = emailTemplateServer.endpointUrl;
    runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_FROM = "no-reply@flowhr.local";
    runtimeEnv.FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_ID = "";
    const missingTemplateIdResponse = await leavePromotionNotifyRoute.POST(
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
        actorHeaders("payroll_operator", "PAY-1240", organization.id)
      )
    );
    assert.equal(
      missingTemplateIdResponse.status,
      400,
      "email-template dispatch should fail when template id cannot be resolved"
    );
  } finally {
    await emailTemplateServer.close();
  }

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("leave.promotion.notice.dispatched.v1"));

  console.log("e2e-wi0124-leave-promotion-email-template-delivery.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
