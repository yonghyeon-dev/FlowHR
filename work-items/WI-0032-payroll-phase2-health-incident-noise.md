# WI-0032: Reduce Payroll Phase2 Health Incident Noise

## Background and Problem

The scheduled `payroll-phase2-health` workflow has been generating repeated incident issues when Phase2 rollout is disabled or partially disabled (feature-flag off). In particular, the health report treated all `409` responses as failures even when the response indicates an expected "feature flag is disabled" state. This causes on-call/ops noise and hides real regressions.

## Scope

### In Scope

- Classify expected `409` failures caused by disabled rollout flags and exclude them from the gate ratio.
- Skip failing the job (gate) when Phase2 is disabled, while still reporting metrics.
- Deduplicate incident issue creation: comment on an existing open incident issue instead of creating a new issue every run.
- Update ops contract/spec artifacts to reflect the new gate behavior and configuration.

### Out of Scope

- Changing payroll domain rules or API contracts.
- Introducing new external alerting systems beyond existing webhook transport.

## User Scenarios

1. Ops: Phase2 disabled in production. The health workflow should report metrics but must not page or open new incidents.
2. Ops: Phase2 enabled. Unexpected 403/409 ratios should fail the workflow and create (or update) a single incident issue.
3. Maintainer: When an incident is open, subsequent failing runs should append context as comments (dedup).

## Payroll Accuracy and Calculation Rules

- Not applicable (monitoring-only change).

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Configure workflow secrets/vars | Allow | Deny | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: not applicable

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit: `npm test`
- Integration: `npm run test:integration`
- Regression: CI `quality-gates` + `golden-regression`
- Authorization: verify only admins can mutate production secrets/vars (process/policy)
- Payroll accuracy: not applicable

## Observability and Audit Logging

- Audit events: none (uses existing AuditLog reads)
- Metrics:
  - `previewFailed409Expected`
  - `previewAttemptsForGate`
- Alert conditions:
  - Gate only when `FLOWHR_PAYROLL_DEDUCTIONS_V1=true`

## Rollback Plan

- Feature flag behavior: gate controlled by `FLOWHR_PAYROLL_DEDUCTIONS_V1`
- DB rollback method: none
- Recovery target time: 15m (revert workflow/script changes)

## Definition of Ready (DoR)

- [ ] Requirements are unambiguous and testable.
- [ ] Ops contract/spec impact reviewed (Phase2 health gate).
- [ ] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Health gate no longer pages when Phase2 is disabled.
- [ ] Expected 409 classification is covered by tests or golden fixture.
- [ ] Incident issue creation is deduplicated (comment on existing open issue).
- [ ] Ops contract/api version bumped and docs updated.
- [ ] CI passes (contract-governance, quality-gates, golden-regression).
