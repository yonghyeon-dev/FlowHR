#!/usr/bin/env node

function isTruthy(value) {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

async function run() {
  const webhook = process.env.FLOWHR_ALERT_SLACK_WEBHOOK ?? "";
  const requireWebhook = isTruthy(process.env.FLOWHR_ALERT_REQUIRE_WEBHOOK);

  if (!webhook) {
    const message = "FLOWHR_ALERT_SLACK_WEBHOOK not configured; skip Slack notification.";
    if (requireWebhook) {
      console.error(message);
      process.exit(1);
    }
    console.log(message);
    return;
  }

  const title = process.env.FLOWHR_ALERT_TITLE ?? "[FlowHR] workflow failure";
  const workflow = process.env.FLOWHR_ALERT_WORKFLOW ?? "unknown-workflow";
  const runUrl = process.env.FLOWHR_ALERT_RUN_URL ?? "";
  const ref = process.env.FLOWHR_ALERT_REF ?? "";
  const trigger = process.env.FLOWHR_ALERT_TRIGGER ?? "";
  const reason = process.env.FLOWHR_ALERT_REASON ?? "";

  const lines = [title, `- Workflow: ${workflow}`];
  if (runUrl) {
    lines.push(`- Run: ${runUrl}`);
  }
  if (ref) {
    lines.push(`- Ref: ${ref}`);
  }
  if (trigger) {
    lines.push(`- Trigger: ${trigger}`);
  }
  if (reason) {
    lines.push(`- Reason: ${reason}`);
  }

  const payload = JSON.stringify({ text: lines.join("\n") });
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack webhook request failed: ${response.status} ${body}`);
  }

  console.log("Slack notification sent.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
