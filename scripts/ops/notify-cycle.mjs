#!/usr/bin/env node

/**
 * Discord cycle notification CLI with embed fields support.
 *
 * Usage:
 *   node scripts/ops/notify-cycle.mjs cycle-start  --title "Cycle 19" --description "WI-0950~0955 (5개)" --fields '[{"name":"WI-0950","value":"직원 초대","inline":true}]'
 *   node scripts/ops/notify-cycle.mjs wi-start     --wi "WI-0950" --description "직원 초대 이메일"
 *   node scripts/ops/notify-cycle.mjs wi-complete   --wi "WI-0950" --description "직원 초대 이메일"
 *   node scripts/ops/notify-cycle.mjs cycle-complete --title "Cycle 19 완료" --success 4 --failure 1 --total 5 --fields '[...]'
 */

const COLORS = {
  info: 3447003,    // blurple
  success: 3066993, // green
  warning: 15158332, // orange
  error: 15548997   // red
};

function resolveWebhook() {
  const url =
    (process.env.FLOWHR_DISCORD_NOTIFICATION_WEBHOOK ?? "").trim() ||
    (process.env.FLOWHR_ALERT_DISCORD_WEBHOOK ?? "").trim();
  return url || null;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }
  return args;
}

function timestamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

async function sendEmbed(webhook, embed) {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${body}`);
  }
  console.log("Discord embed sent.");
}

async function sendContent(webhook, content) {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 1990) })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${body}`);
  }
  console.log("Discord message sent.");
}

async function run() {
  const [subcommand, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const webhook = resolveWebhook();

  if (!webhook) {
    console.log("No Discord webhook configured. Skipping.");
    return;
  }

  switch (subcommand) {
    case "cycle-start": {
      const fields = args.fields ? JSON.parse(args.fields) : [];
      await sendEmbed(webhook, {
        title: `📊 ${args.title ?? "Cycle 시작"}`,
        description: args.description ?? "",
        color: COLORS.info,
        ...(fields.length ? { fields } : {}),
        footer: { text: `FlowHR Codex | ${timestamp()}` }
      });
      break;
    }

    case "wi-start": {
      await sendContent(webhook, `⏳ ${args.wi ?? "WI-????"} ${args.description ?? ""} 시작`);
      break;
    }

    case "wi-complete": {
      const success = args.success !== "false";
      const icon = success ? "✅" : "❌";
      await sendContent(webhook, `${icon} ${args.wi ?? "WI-????"} ${args.description ?? ""} ${success ? "완료" : "실패"}`);
      break;
    }

    case "cycle-complete": {
      const success = parseInt(args.success ?? "0", 10);
      const failure = parseInt(args.failure ?? "0", 10);
      const total = parseInt(args.total ?? String(success + failure), 10);
      const color = failure === 0 ? COLORS.success : COLORS.warning;
      const icon = failure === 0 ? "✅" : "⚠️";
      const fields = args.fields ? JSON.parse(args.fields) : [];
      await sendEmbed(webhook, {
        title: `${icon} ${args.title ?? "Cycle 완료"}`,
        description: `성공 ${success} / 실패 ${failure} / 총 ${total}`,
        color,
        ...(fields.length ? { fields } : {}),
        footer: { text: `FlowHR Codex | ${timestamp()}` }
      });
      break;
    }

    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      console.error("Available: cycle-start, wi-start, wi-complete, cycle-complete");
      process.exit(1);
  }
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
