# WI-0039: Discord Alert Message Localization (Korean)

## Background and Problem

FlowHR supports both Slack and Discord webhooks for ops alerts. Discord notifications are currently formatted with
English labels, which makes incident response harder for Korean-first operators.

## Scope

### In Scope

- When the configured webhook provider is Discord, format alert message labels in Korean.
- Keep Slack formatting unchanged.
- Update default alert titles in GitHub workflows to Korean (operators can still override via inputs/env).
- Update regression tests to lock the Discord payload content expectations.

### Out of Scope

- Translating arbitrary custom titles supplied externally (we only adjust FlowHR workflow defaults).
- Changing webhook transport, payload schema, or provider detection rules.

## User Scenarios

1. An operator receives a Discord alert and can immediately understand:
   - which workflow failed
   - where to click (runbook / break-glass / rollback links)
2. Slack users see no behavioral change.

## Payroll Accuracy and Calculation Rules

- Not applicable.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Send ops alert webhook message | N/A | N/A | N/A | Allow |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: not applicable

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit: not required (script-level behavior)
- Integration: update `scripts/tests/ops-alert-webhook.test.ts` expectations
- Regression: `npm.cmd run test:integration` must remain green

## Observability and Audit Logging

- Audit events: none
- Metrics: none
- Alert conditions: not applicable (this change affects alert message formatting only)

## Rollback Plan

- Feature flag behavior: not applicable
- Rollback method: revert the PR
- Recovery target time: 10m

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Discord alert message labels are in Korean.
- [ ] Slack alert message format is unchanged.
- [ ] `test:integration` passes.
