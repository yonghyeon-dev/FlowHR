# WI-0014: Alert Webhook Regression Tests in CI

## Background and Problem

Alert webhook logic now supports Discord and Slack payloads, but CI does not directly test payload shape and failure handling.
Without dedicated regression tests, provider-specific changes can break production alerts silently.

## Scope

### In Scope

- Add alert webhook regression tests for notifier script behavior.
- Validate Discord payload shape, Slack payload shape, missing webhook guard, and non-2xx failure handling.
- Include alert webhook tests in `test:integration` so `quality-gates` blocks regressions.

### Out of Scope

- External webhook endpoint integration tests.
- Alert message formatting by domain severity.
- Multi-channel fan-out policy.

## User Scenarios

1. Developer changes notifier code and CI catches payload regression before merge.
2. Operator can trust that Discord/Slack alert path remains functional after refactor.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: operational alerts must remain deterministic and machine-validated in CI.
- Rounding rule: not applicable.
- Exception handling rule: notifier exits with code `1` for required-webhook-missing or webhook non-2xx.

## Authorization and Role Matrix

| Action | Admin | Payroll Operator | Manager | Employee |
| --- | --- | --- | --- | --- |
| Modify alert notifier script/tests | Allow | Allow | Deny | Deny |
| Merge CI gate changes | Allow | Allow | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: script/test-only additive change

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - missing webhook with `FLOWHR_ALERT_REQUIRE_WEBHOOK=false` returns success
  - missing webhook with `FLOWHR_ALERT_REQUIRE_WEBHOOK=true` returns failure
- Integration:
  - local HTTP server captures Discord `content` payload
  - local HTTP server captures Slack `text` payload
  - non-2xx webhook response returns failure
- Regression:
  - `npm run test:integration` includes alert webhook tests
- Authorization:
  - no auth surface change
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - CI pass/fail for `test:integration`
- Alert conditions:
  - `quality-gates` failure on notifier regression

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting script/test integration.

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
