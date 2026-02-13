# WI-0011: Slack Alert Unification and Webhook Smoke Workflow

## Background and Problem

Failure workflows currently embed Slack webhook `curl` logic inline.  
This duplicates payload construction, makes auditing difficult, and leaves webhook connectivity checks ad hoc.

## Scope

### In Scope

- Add shared Slack notifier script for workflow failure notifications.
- Replace inline Slack notification steps in production failure workflows.
- Add manual workflow to smoke-test webhook connectivity.

### Out of Scope

- Slack channel routing by severity.
- PagerDuty/Opsgenie integration.
- Automatic secret provisioning.

## User Scenarios

1. Operator receives consistent Slack messages from production failure workflows.
2. Operator triggers a manual smoke workflow to verify webhook configuration before release windows.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: operational alerting must include workflow/run metadata for traceability.
- Rounding rule: not applicable.
- Exception handling rule: missing webhook returns non-fatal skip for failure workflows and hard-fail for smoke workflow.

## Authorization and Role Matrix

| Action | Admin | Payroll Operator | Manager | Employee |
| --- | --- | --- | --- | --- |
| Configure production Slack webhook secret | Allow | Deny | Deny | Deny |
| Trigger alert-webhook-smoke workflow | Allow | Allow | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: workflow/script-only additive change

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - notifier script truthy parsing and missing webhook behavior
- Integration:
  - failure workflows invoke notifier with workflow metadata env
- Regression:
  - existing CI quality gates remain green
- Authorization:
  - production environment secret remains required for actual webhook send
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events:
  - none (workflow-level operation)
- Metrics:
  - failure workflow notification send success/failure from job logs
- Alert conditions:
  - webhook smoke workflow failure

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m (revert workflow/script changes).

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
