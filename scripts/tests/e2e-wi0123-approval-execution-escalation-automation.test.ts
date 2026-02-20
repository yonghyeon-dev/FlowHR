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
runtimeEnv.FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_PROVIDER = "discord";
runtimeEnv.FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_URL = "";
runtimeEnv.FLOWHR_APPROVAL_EXECUTION_ESCALATION_DISCORD_WEBHOOK = "";
runtimeEnv.FLOWHR_APPROVAL_EXECUTION_ESCALATION_SLACK_WEBHOOK = "";
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
  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
  const approvalExecutionEscalateRoute = await import(
    "../../src/app/api/approval/executions/escalate/route.ts"
  );

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const organization = await memoryDataAccess.organizations.create({ name: "Org Approval Escalation" });
  const organizationId = organization.id;
  const asOfIso = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

  await memoryDataAccess.approvals.createExecution({
    organizationId,
    domain: "PAYROLL",
    targetEntityType: "PayrollRun",
    targetEntityId: "PR-ESCALATE-001",
    totalStages: 2,
    currentStageIndex: 1,
    state: "PENDING",
    startedAt: new Date("2026-02-20T00:00:00.000Z")
  });
  await new Promise((resolve) => setTimeout(resolve, 15));
  await memoryDataAccess.approvals.createExecution({
    organizationId,
    domain: "LEAVE",
    targetEntityType: "LeaveRequest",
    targetEntityId: "LR-ESCALATE-001",
    totalStages: 2,
    currentStageIndex: 1,
    state: "PENDING",
    startedAt: new Date("2026-02-20T00:10:00.000Z")
  });
  await new Promise((resolve) => setTimeout(resolve, 15));
  await memoryDataAccess.approvals.createExecution({
    organizationId,
    domain: "ATTENDANCE",
    targetEntityType: "AttendanceRecord",
    targetEntityId: "AR-ESCALATE-001",
    totalStages: 2,
    currentStageIndex: 2,
    state: "APPROVED",
    startedAt: new Date("2026-02-20T00:15:00.000Z"),
    completedAt: new Date("2026-02-20T00:20:00.000Z")
  });

  const webhookServer = await startWebhookServer();
  runtimeEnv.FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_URL = webhookServer.webhookUrl;

  try {
    const dryRunResponse = await approvalExecutionEscalateRoute.POST(
      jsonRequest(
        "POST",
        "/api/approval/executions/escalate",
        {
          organizationId,
          stalledHoursMin: 1,
          asOf: asOfIso,
          dryRun: true,
          notificationChannel: "qa-dry-run"
        },
        actorHeaders("admin", "ADM-0123", organizationId)
      )
    );
    assert.equal(dryRunResponse.status, 200, "dry-run escalate should succeed");
    const dryRunBody = await readJson<{
      dryRun: boolean;
      counts: { candidates: number; requested: number; dryRun: number };
      items: Array<{ domain: string; decision: string }>;
    }>(dryRunResponse);
    assert.equal(dryRunBody.dryRun, true);
    assert.equal(dryRunBody.counts.candidates, 2);
    assert.equal(dryRunBody.counts.requested, 0);
    assert.equal(dryRunBody.counts.dryRun, 2);
    assert.equal(dryRunBody.items[0]?.domain, "PAYROLL");
    assert.equal(dryRunBody.items[0]?.decision, "DRY_RUN");
    assert.equal(webhookServer.capturedRequests.length, 0, "dry-run must not send webhook");

    const dispatchResponse = await approvalExecutionEscalateRoute.POST(
      jsonRequest(
        "POST",
        "/api/approval/executions/escalate",
        {
          organizationId,
          stalledHoursMin: 1,
          asOf: asOfIso,
          dryRun: false,
          notificationChannel: "approval-stalled-queue"
        },
        actorHeaders("admin", "ADM-0123", organizationId)
      )
    );
    assert.equal(dispatchResponse.status, 200, "dispatch escalate should succeed");
    const dispatchBody = await readJson<{
      dryRun: boolean;
      counts: { candidates: number; requested: number };
      policy: { provider: string | null; webhookConfigured: boolean };
      items: Array<{ decision: string }>;
    }>(dispatchResponse);
    assert.equal(dispatchBody.dryRun, false);
    assert.equal(dispatchBody.counts.candidates, 2);
    assert.equal(dispatchBody.counts.requested, 2);
    assert.equal(dispatchBody.policy.provider, "discord");
    assert.equal(dispatchBody.policy.webhookConfigured, true);
    assert.equal(dispatchBody.items[0]?.decision, "REQUESTED");
    assert.equal(webhookServer.capturedRequests.length, 1, "dispatch should send exactly one webhook");

    const webhookPayload = JSON.parse(webhookServer.capturedRequests[0].body) as Record<string, unknown>;
    assert.equal(typeof webhookPayload.content, "string", "discord payload must use content");
    assert.match(String(webhookPayload.content), /결재 실행 정체 에스컬레이션/);
    assert.match(String(webhookPayload.content), /candidateCount: 2/);

    const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
    assert.ok(
      eventNames.includes("approval.execution.escalation.requested.v1"),
      "dispatch should emit approval escalation event"
    );

    runtimeEnv.FLOWHR_APPROVAL_EXECUTION_ESCALATION_WEBHOOK_URL = "";
    const noCandidateResponse = await approvalExecutionEscalateRoute.POST(
      jsonRequest(
        "POST",
        "/api/approval/executions/escalate",
        {
          organizationId,
          stalledHoursMin: 9999,
          asOf: asOfIso,
          dryRun: false
        },
        actorHeaders("admin", "ADM-0123", organizationId)
      )
    );
    assert.equal(noCandidateResponse.status, 200, "no candidate dispatch should succeed without webhook");
    const noCandidateBody = await readJson<{
      counts: { candidates: number; requested: number; skippedNoCandidate: number };
    }>(noCandidateResponse);
    assert.equal(noCandidateBody.counts.candidates, 0);
    assert.equal(noCandidateBody.counts.requested, 0);
    assert.equal(noCandidateBody.counts.skippedNoCandidate, 1);

    const missingWebhookResponse = await approvalExecutionEscalateRoute.POST(
      jsonRequest(
        "POST",
        "/api/approval/executions/escalate",
        {
          organizationId,
          stalledHoursMin: 1,
          asOf: asOfIso,
          dryRun: false
        },
        actorHeaders("admin", "ADM-0123", organizationId)
      )
    );
    assert.equal(
      missingWebhookResponse.status,
      503,
      "candidate dispatch should fail when escalation webhook is missing"
    );
  } finally {
    await webhookServer.close();
  }

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("approval.execution.escalation.generated"));
  assert.ok(auditActions.includes("approval.execution.escalation.requested"));
  assert.ok(auditActions.includes("approval.execution.escalation.failed"));

  console.log("e2e-wi0123-approval-execution-escalation-automation.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
