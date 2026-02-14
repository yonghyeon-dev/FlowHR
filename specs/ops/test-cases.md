# Ops Test Cases (Contract v0.1.0)

## Alert Webhook Smoke (Discord-first, Slack fallback)

- When `FLOWHR_ALERT_DISCORD_WEBHOOK` is configured, `alert-webhook-smoke` must send a Discord-compatible payload and exit successfully.
- When Discord webhook is missing but `FLOWHR_ALERT_SLACK_WEBHOOK` is configured, the notifier must send Slack payload and exit successfully.
- When both Discord and Slack webhooks are missing and `FLOWHR_ALERT_REQUIRE_WEBHOOK=true`, notifier must fail with a clear message.

## Local Dev Port

- `npm run dev:3001` starts Next.js dev server on port `3001`.
- Root page `/` responds with HTTP 200 after startup.

## Local Artifact Hygiene

- `git status` does not show `.devserver.*.log` and `.tmp-*` directories as untracked noise.

