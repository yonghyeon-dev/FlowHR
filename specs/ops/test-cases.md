# Ops Test Cases (Contract v0.1.5)

## Alert Webhook Smoke (Discord-first, Slack fallback)

- When `FLOWHR_ALERT_DISCORD_WEBHOOK` is configured, `alert-webhook-smoke` must send a Discord-compatible payload and exit successfully.
- When Discord webhook is missing but `FLOWHR_ALERT_SLACK_WEBHOOK` is configured, the notifier must send Slack payload and exit successfully.
- When both Discord and Slack webhooks are missing and `FLOWHR_ALERT_REQUIRE_WEBHOOK=true`, notifier must fail with a clear message.

## Local Dev Port

- `npm run dev:3001` starts Next.js dev server on port `3001`.
- Root page `/` responds with HTTP 200 after startup.

## Local Artifact Hygiene

- `git status` does not show `.devserver.*.log` and `.tmp-*` directories as untracked noise.

## MVP Console List Actions

- Console provides buttons to call list endpoints and shows JSON payload in the log panel:
  - `GET /api/attendance/records`
  - `GET /api/leave/requests`
  - `GET /api/payroll/runs`

## Roadmap / Planning Artifacts

- `ROADMAP.md` must reflect current merged WI status (e.g., WI-0032 is completed) and Phase 1 priorities.
- Roadmap/doc updates must not break contract governance gates.
- Phase 1 WI stubs exist under `work-items/` and can be expanded contract-first.

## Payroll Phase2 Health Gate (Noise Control)

- When `FLOWHR_PAYROLL_DEDUCTIONS_V1=false`, `payroll-phase2-health` must:
  - print a summary including `Gate: skipped (FLOWHR_PAYROLL_DEDUCTIONS_V1=false)`
  - exit successfully (no incident issue, no alert webhook)
- `409` failures must be classified as:
  - expected: rollout flag is off, excluded from gate ratio
  - mismatch: rollout flag is on, included in gate ratio (config mismatch signal)
  - ignored: any other 409 business-input conflict, excluded from gate ratio but reported for triage
- When `FLOWHR_PAYROLL_DEDUCTIONS_V1=true` and `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1=false`, `409` failures with message:
  - `payroll_deduction_profile_v1 feature flag is disabled`
  must be counted as "expected" and excluded from the gate ratio.
- When `FLOWHR_PAYROLL_DEDUCTIONS_V1=true` and `FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1=true`, `409` failures with message:
  - `payroll_deduction_profile_v1 feature flag is disabled`
  must be counted as "mismatch" and included in the gate ratio.
- When `FLOWHR_PAYROLL_DEDUCTIONS_V1=true`, `403` ratio and `409 mismatch` ratio above thresholds must fail the workflow.
- Step summary must include a `409 message breakdown (top 5)` section when 409s are observed.
- Incident issue deduplication:
  - If an open `[phase2-health]` issue exists with labels `incident, phase2, ops`, the workflow must add a comment instead of creating a new issue.

