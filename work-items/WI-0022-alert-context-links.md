# WI-0022: Alert Context Link Enrichment

## Background and Problem

Failure webhook alerts currently deliver run metadata, but on-call operators still need manual lookup for runbook, break-glass policy, and rollback workflow links.
This slows incident response and increases operational friction during failures.

## Scope

### In Scope

- Extend `notify-slack-failure.mjs` to include optional context links:
  - runbook URL
  - break-glass policy URL
  - rollback workflow URL
- Update production failure workflows to pass context link env vars.
- Extend webhook regression tests to assert enriched payload lines for Slack and Discord providers.

### Out of Scope

- Alert deduplication/rate limiting.
- Pager escalation integration.
- Incident auto-ticket assignment logic.

## User Scenarios

1. On failure, operator receives alert with direct runbook and rollback workflow links.
2. QA/ops can jump straight to break-glass policy without manual repository search.
3. Alert payload remains provider-compatible for Slack and Discord.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: alerts must include actionable remediation context for payroll-affecting failures.
- Rounding rule: not applicable.
- Exception handling rule: context links are optional fields; missing values should not block alert delivery.

## Authorization and Role Matrix

| Action | Orchestrator | QA Agent | Domain Agent | Employee |
| --- | --- | --- | --- | --- |
| Update alert notifier script | Allow | Allow | Allow | Deny |
| Merge alert context policy updates | Allow | Allow | Allow | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: additive alert payload fields only

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - notifier includes context links when env vars are present
  - notifier remains valid when context links are omitted
- Integration:
  - `ops-alert-webhook.test.ts` validates enriched payload content for Slack/Discord
- Regression:
  - existing notifier success/failure path tests remain green

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - alert delivery success/failure (existing notifier behavior)
- Alert conditions:
  - webhook delivery failures

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting notifier field additions.

## Definition of Ready (DoR)

- [ ] Target workflows for context enrichment are identified.
- [ ] Runbook/break-glass/rollback links are fixed and stable.
- [ ] Provider compatibility constraints are understood.

## Definition of Done (DoD)

- [ ] Notifier supports optional context links.
- [ ] Production failure workflows pass context link env vars.
- [ ] Regression tests cover enriched payload content.
- [ ] WI and execution plan updated.
