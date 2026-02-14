import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import http from "node:http";
import path from "node:path";

type CommandResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

type CapturedRequest = {
  method: string;
  body: string;
};

const notifierScriptPath = path.resolve(process.cwd(), "scripts", "ops", "notify-slack-failure.mjs");

async function runNotifier(env: Record<string, string | undefined>): Promise<CommandResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [notifierScriptPath], {
      env: {
        ...process.env,
        ...env
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr
      });
    });
  });
}

async function startWebhookServer(responseStatus = 200, responseBody = "ok") {
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
    response.statusCode = responseStatus;
    response.end(responseBody);
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to acquire test webhook server address");
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

async function testMissingWebhookAllowsPass() {
  const result = await runNotifier({
    FLOWHR_ALERT_WEBHOOK_URL: "",
    FLOWHR_ALERT_DISCORD_WEBHOOK: "",
    FLOWHR_ALERT_SLACK_WEBHOOK: "",
    FLOWHR_ALERT_REQUIRE_WEBHOOK: "false"
  });
  assert.equal(result.code, 0, "missing webhook should be non-fatal when require flag is false");
  assert.match(result.stdout, /Alert webhook not configured/, "stdout should describe missing webhook");
}

async function testMissingWebhookFailsWhenRequired() {
  const result = await runNotifier({
    FLOWHR_ALERT_WEBHOOK_URL: "",
    FLOWHR_ALERT_DISCORD_WEBHOOK: "",
    FLOWHR_ALERT_SLACK_WEBHOOK: "",
    FLOWHR_ALERT_REQUIRE_WEBHOOK: "true"
  });
  assert.equal(result.code, 1, "missing webhook should fail when require flag is true");
  assert.match(result.stderr, /Alert webhook not configured/, "stderr should describe missing webhook");
}

async function testDiscordPayloadShape() {
  const server = await startWebhookServer();
  try {
    const result = await runNotifier({
      FLOWHR_ALERT_WEBHOOK_URL: server.webhookUrl,
      FLOWHR_ALERT_WEBHOOK_PROVIDER: "discord",
      FLOWHR_ALERT_TITLE: "[FlowHR] discord test",
      FLOWHR_ALERT_WORKFLOW: "ops-alert-webhook-test",
      FLOWHR_ALERT_RUN_URL: "https://example.com/run/discord",
      FLOWHR_ALERT_REF: "refs/heads/main",
      FLOWHR_ALERT_TRIGGER: "workflow_dispatch",
      FLOWHR_ALERT_RUNBOOK_URL: "https://example.com/runbook",
      FLOWHR_ALERT_BREAK_GLASS_URL: "https://example.com/break-glass",
      FLOWHR_ALERT_ROLLBACK_WORKFLOW_URL: "https://example.com/rollback"
    });

    assert.equal(result.code, 0, "discord webhook send should succeed");
    assert.match(result.stdout, /sent via discord/i);
    assert.equal(server.capturedRequests.length, 1, "discord webhook should receive exactly one request");

    const payload = JSON.parse(server.capturedRequests[0].body) as Record<string, unknown>;
    assert.equal(typeof payload.content, "string", "discord payload should use content field");
    assert.equal(payload.text, undefined, "discord payload should not include slack text field");
    assert.match(String(payload.content), /\[FlowHR\] discord test/);
    assert.match(String(payload.content), /Runbook: https:\/\/example.com\/runbook/);
    assert.match(String(payload.content), /Break-glass: https:\/\/example.com\/break-glass/);
    assert.match(String(payload.content), /Rollback workflow: https:\/\/example.com\/rollback/);
  } finally {
    await server.close();
  }
}

async function testSlackPayloadShape() {
  const server = await startWebhookServer();
  try {
    const result = await runNotifier({
      FLOWHR_ALERT_WEBHOOK_URL: server.webhookUrl,
      FLOWHR_ALERT_WEBHOOK_PROVIDER: "slack",
      FLOWHR_ALERT_TITLE: "[FlowHR] slack test",
      FLOWHR_ALERT_WORKFLOW: "ops-alert-webhook-test",
      FLOWHR_ALERT_RUN_URL: "https://example.com/run/slack",
      FLOWHR_ALERT_REF: "refs/heads/main",
      FLOWHR_ALERT_TRIGGER: "workflow_dispatch",
      FLOWHR_ALERT_RUNBOOK_URL: "https://example.com/runbook",
      FLOWHR_ALERT_BREAK_GLASS_URL: "https://example.com/break-glass",
      FLOWHR_ALERT_ROLLBACK_WORKFLOW_URL: "https://example.com/rollback"
    });

    assert.equal(result.code, 0, "slack webhook send should succeed");
    assert.match(result.stdout, /sent via slack/i);
    assert.equal(server.capturedRequests.length, 1, "slack webhook should receive exactly one request");

    const payload = JSON.parse(server.capturedRequests[0].body) as Record<string, unknown>;
    assert.equal(typeof payload.text, "string", "slack payload should use text field");
    assert.equal(payload.content, undefined, "slack payload should not include discord content field");
    assert.match(String(payload.text), /\[FlowHR\] slack test/);
    assert.match(String(payload.text), /Runbook: https:\/\/example.com\/runbook/);
    assert.match(String(payload.text), /Break-glass: https:\/\/example.com\/break-glass/);
    assert.match(String(payload.text), /Rollback workflow: https:\/\/example.com\/rollback/);
  } finally {
    await server.close();
  }
}

async function testWebhookFailurePropagatesExitCode() {
  const server = await startWebhookServer(500, "internal-error");
  try {
    const result = await runNotifier({
      FLOWHR_ALERT_WEBHOOK_URL: server.webhookUrl,
      FLOWHR_ALERT_WEBHOOK_PROVIDER: "discord",
      FLOWHR_ALERT_TITLE: "[FlowHR] failure test",
      FLOWHR_ALERT_WORKFLOW: "ops-alert-webhook-test"
    });

    assert.equal(result.code, 1, "non-2xx webhook response should fail");
    assert.match(result.stderr, /webhook request failed/i);
    assert.equal(server.capturedRequests.length, 1, "failed webhook call should still send one request");
  } finally {
    await server.close();
  }
}

async function run() {
  await testMissingWebhookAllowsPass();
  await testMissingWebhookFailsWhenRequired();
  await testDiscordPayloadShape();
  await testSlackPayloadShape();
  await testWebhookFailurePropagatesExitCode();
}

run()
  .then(() => {
    console.log("ops-alert-webhook.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
