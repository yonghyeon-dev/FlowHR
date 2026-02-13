# WI-0013: Discord Alert Webhook Support with Slack Fallback

## Background and Problem

Current failure-alert pipeline is wired for Slack-oriented payloads and secret naming.
The operator requested Discord webhook as the primary alert channel.

## Scope

### In Scope

- Extend alert notifier to support Discord webhook payload format.
- Keep Slack compatibility for existing environments.
- Update failure workflows and webhook smoke workflow to use Discord-first secret resolution.

### Out of Scope

- Multi-channel fan-out (send to both Discord and Slack simultaneously).
- Provider-specific message templates by severity.
- Alert acknowledgement workflows.

## User Scenarios

1. Operator configures Discord webhook and receives workflow failure notifications.
2. Existing Slack setup continues to work without code changes.
3. Webhook smoke workflow fails when no alert webhook is configured.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: alerts must include workflow name and run URL for traceability.
- Rounding rule: not applicable.
- Exception handling rule: missing webhook is non-fatal for failure hooks, fatal for smoke workflow.

## Authorization and Role Matrix

| Action | Admin | Payroll Operator | Manager | Employee |
| --- | --- | --- | --- | --- |
| Configure production alert webhook secret | Allow | Deny | Deny | Deny |
| Trigger `alert-webhook-smoke` workflow | Allow | Allow | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: additive workflow/script update only

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - webhook provider auto-detection (discord/slack)
  - missing webhook guard behavior (`requireWebhook=true/false`)
- Integration:
  - failure workflows pass provider secrets to notifier
  - smoke workflow enforces webhook presence
- Regression:
  - CI quality gates remain green
- Authorization:
  - production secret write remains admin-only
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events:
  - none (workflow layer)
- Metrics:
  - workflow notification success/failure logs
- Alert conditions:
  - `alert-webhook-smoke` failure

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting workflow/script changes.

## Definition of Ready (DoR)

- [ ] Requirements are unambiguous and testable.
- [ ] Domain contract drafted or updated.
- [ ] Role matrix reviewed by QA.
- [ ] Data migration impact assessed.
- [ ] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.
