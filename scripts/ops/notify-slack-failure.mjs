#!/usr/bin/env node

function isTruthy(value) {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function normalize(value) {
  return (value ?? "").trim();
}

function resolveWebhook() {
  const direct = normalize(process.env.FLOWHR_ALERT_WEBHOOK_URL);
  if (direct) {
    return { url: direct, source: "FLOWHR_ALERT_WEBHOOK_URL" };
  }

  const discord = normalize(process.env.FLOWHR_ALERT_DISCORD_WEBHOOK);
  if (discord) {
    return { url: discord, source: "FLOWHR_ALERT_DISCORD_WEBHOOK" };
  }

  const slack = normalize(process.env.FLOWHR_ALERT_SLACK_WEBHOOK);
  if (slack) {
    return { url: slack, source: "FLOWHR_ALERT_SLACK_WEBHOOK" };
  }

  return null;
}

function resolveProvider(webhookUrl) {
  const configured = normalize(process.env.FLOWHR_ALERT_WEBHOOK_PROVIDER).toLowerCase();
  if (configured === "discord" || configured === "slack") {
    return configured;
  }

  if (
    webhookUrl.includes("discord.com/api/webhooks/") ||
    webhookUrl.includes("discordapp.com/api/webhooks/")
  ) {
    return "discord";
  }
  if (webhookUrl.includes("hooks.slack.com/services/")) {
    return "slack";
  }

  return "slack";
}

async function run() {
  const webhook = resolveWebhook();
  const requireWebhook = isTruthy(process.env.FLOWHR_ALERT_REQUIRE_WEBHOOK);

  if (!webhook) {
    const message =
      "Alert webhook not configured; set FLOWHR_ALERT_DISCORD_WEBHOOK, FLOWHR_ALERT_SLACK_WEBHOOK, or FLOWHR_ALERT_WEBHOOK_URL.";
    if (requireWebhook) {
      console.error(message);
      process.exit(1);
    }
    console.log(message);
    return;
  }
  const provider = resolveProvider(webhook.url);

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
  const message = lines.join("\n");

  const payload =
    provider === "discord"
      ? JSON.stringify({ content: message })
      : JSON.stringify({ text: message });

  const response = await fetch(webhook.url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${provider} webhook request failed: ${response.status} ${body}`);
  }

  console.log(`Alert notification sent via ${provider} (${webhook.source}).`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
