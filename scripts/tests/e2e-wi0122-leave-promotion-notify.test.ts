import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_WEBHOOK_PROVIDER = "discord";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_WEBHOOK_URL = "";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_DISCORD_WEBHOOK = "";
runtimeEnv.FLOWHR_LEAVE_PROMOTION_SLACK_WEBHOOK = "";
runtimeEnv.FLOWHR_ALERT_WEBHOOK_URL = "";
runtimeEnv.FLOWHR_ALERT_DISCORD_WEBHOOK = "";
runtimeEnv.FLOWHR_ALERT_SLACK_WEBHOOK = "";

type CapturedRequest = {
  method: string;
  body: string;
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

async function startWebhookServer() {
  const capturedRequests: CapturedRequest[] = [];
  const server = http.createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }
    capturedRequests.push({
      method: request.method ?? "UNKNOWN",
      body: Buffer.concat(chunks).toString("utf8")
    });
    response.statusCode = 200;
    response.end("ok");
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to resolve webhook server address");
  }

  return {
    webhookUrl: `http://127.0.0.1:${address.port}/webhook`,
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
  const leavePolicyRoute = await import("../../src/app/api/leave/policy/route.ts");
  const leavePromotionNotifyRoute = await import(
    "../../src/app/api/leave/policy/promotion-notify/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "Org Leave Promotion Notify" });
  const employeeA = "EMP-NOTIFY-001";
  const employeeB = "EMP-NOTIFY-002";
  await memoryDataAccess.employees.create({
    id: employeeA,
    organizationId: organization.id,
    name: "Notify Employee A",
    email: "notify-a@example.com"
  });
  await memoryDataAccess.employees.create({
    id: employeeB,
    organizationId: organization.id,
    name: "Notify Employee B",
    email: "notify-b@example.com"
  });

  await memoryDataAccess.leaveBalance.ensure(employeeA, 15);
  await memoryDataAccess.leaveBalance.ensure(employeeB, 15);
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeA,
    usedDaysDelta: 4,
    defaultGrantedDays: 15
  });
  await memoryDataAccess.leaveBalance.applyUsage({
    employeeId: employeeB,
    usedDaysDelta: 12,
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
      actorHeaders("payroll_operator", "PAY-1220", organization.id)
    )
  );
  assert.equal(savePolicyResponse.status, 200, "leave policy save should succeed");

  const webhookServer = await startWebhookServer();
  runtimeEnv.FLOWHR_LEAVE_PROMOTION_WEBHOOK_URL = webhookServer.webhookUrl;

  try {
    const dryRunResponse = await leavePromotionNotifyRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/policy/promotion-notify",
        {
          organizationId: organization.id,
          asOf: "2026-01-10T00:00:00.000Z",
          includeUpcoming: true,
          dryRun: true
        },
        actorHeaders("payroll_operator", "PAY-1220", organization.id)
      )
    );
    assert.equal(dryRunResponse.status, 200, "dry-run notify should succeed");
    const dryRunBody = await readJson<{
      summary: { displayTargetCount: number; sentTargetCount: number };
      delivery: { status: string; attempted: boolean; dryRun: boolean };
    }>(dryRunResponse);
    assert.equal(dryRunBody.delivery.status, "dry_run");
    assert.equal(dryRunBody.delivery.attempted, false);
    assert.equal(dryRunBody.delivery.dryRun, true);
    assert.equal(dryRunBody.summary.displayTargetCount, 1);
    assert.equal(dryRunBody.summary.sentTargetCount, 0);
    assert.equal(webhookServer.capturedRequests.length, 0, "dry-run must not call webhook");

    const noTargetResponse = await leavePromotionNotifyRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/policy/promotion-notify",
        {
          organizationId: organization.id,
          asOf: "2026-01-10T00:00:00.000Z",
          includeUpcoming: false,
          dryRun: false
        },
        actorHeaders("payroll_operator", "PAY-1220", organization.id)
      )
    );
    assert.equal(noTargetResponse.status, 200, "no-target notify should succeed");
    const noTargetBody = await readJson<{
      summary: { displayTargetCount: number; sentTargetCount: number };
      delivery: { status: string; attempted: boolean };
    }>(noTargetResponse);
    assert.equal(noTargetBody.delivery.status, "skipped_no_targets");
    assert.equal(noTargetBody.delivery.attempted, false);
    assert.equal(noTargetBody.summary.displayTargetCount, 0);
    assert.equal(noTargetBody.summary.sentTargetCount, 0);
    assert.equal(webhookServer.capturedRequests.length, 0, "no-target run must not call webhook");

    const dispatchResponse = await leavePromotionNotifyRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/policy/promotion-notify",
        {
          organizationId: organization.id,
          asOf: "2026-12-15T00:00:00.000Z",
          includeUpcoming: false,
          dryRun: false
        },
        actorHeaders("payroll_operator", "PAY-1220", organization.id)
      )
    );
    assert.equal(dispatchResponse.status, 200, "dispatch should succeed");
    const dispatchBody = await readJson<{
      summary: { displayTargetCount: number; sentTargetCount: number };
      delivery: {
        status: string;
        attempted: boolean;
        provider: string | null;
        webhookConfigured: boolean;
      };
    }>(dispatchResponse);
    assert.equal(dispatchBody.delivery.status, "dispatched");
    assert.equal(dispatchBody.delivery.attempted, true);
    assert.equal(dispatchBody.delivery.provider, "discord");
    assert.equal(dispatchBody.delivery.webhookConfigured, true);
    assert.equal(dispatchBody.summary.displayTargetCount, 1);
    assert.equal(dispatchBody.summary.sentTargetCount, 1);
    assert.equal(webhookServer.capturedRequests.length, 1, "dispatch should call webhook once");

    const webhookPayload = JSON.parse(webhookServer.capturedRequests[0].body) as Record<string, unknown>;
    assert.equal(typeof webhookPayload.content, "string", "discord payload must use content field");
    assert.equal(webhookPayload.text, undefined, "discord payload must not use slack text field");
    assert.match(String(webhookPayload.content), /\[FlowHR\] 연차 촉진 공지 발송/);
    assert.match(String(webhookPayload.content), /대상자/);

    runtimeEnv.FLOWHR_LEAVE_PROMOTION_WEBHOOK_URL = "";
    const missingWebhookResponse = await leavePromotionNotifyRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/policy/promotion-notify",
        {
          organizationId: organization.id,
          asOf: "2026-12-15T00:00:00.000Z",
          includeUpcoming: false,
          dryRun: false
        },
        actorHeaders("payroll_operator", "PAY-1220", organization.id)
      )
    );
    assert.equal(missingWebhookResponse.status, 503, "missing webhook should fail when dispatch is required");
  } finally {
    await webhookServer.close();
  }

  console.log("e2e-wi0122-leave-promotion-notify.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
