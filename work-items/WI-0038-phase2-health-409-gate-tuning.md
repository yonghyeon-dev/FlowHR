# WI-0038: Phase2 Health 409 Gate Tuning (Reduce False Incidents)

## Background and Problem

The scheduled `payroll-phase2-health` workflow monitors phase2 preview stability using `403/409` ratios derived from `AuditLog` entries (`payroll.preview_with_deductions.failed`). After WI-0032, expected 409s caused by disabled rollout flags are excluded, but the gate still treats all remaining `409` as health failures.

In practice, many `409` failures are **business input conflicts** (e.g., invalid deduction numbers) and are not reliable indicators of system health. This can still create incident noise during low-volume rollout/testing.

## Scope

### In Scope

- Narrow the `409` gate to **configuration-mismatch** signals only:
  - `payroll_deductions_v1 feature flag is disabled` (while Phase2 flag is on)
  - `payroll_deduction_profile_v1 feature flag is disabled` (while profile flag is on)
- Treat other `409` messages as **reported-only** (tracked and shown in the report, but excluded from gate ratio).
- Add a small 409 message breakdown to the report for faster triage.
- Update ops docs/spec test-cases to reflect the updated gate semantics.

### Out of Scope

- Changing payroll business rules.
- Adding 5xx monitoring (requires additional telemetry/audit instrumentation).

## User Scenarios

1. Phase2 enabled: gate fails only when the API is misconfigured (feature flag mismatch), not due to user input conflicts.
2. Ops can see which 409 messages occurred from the run log without querying the DB.

## Payroll Accuracy and Calculation Rules

- Not applicable.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Change ops health monitor rules | Allow | Deny | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: not applicable

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit: phase2-health report classifier for expected/mismatch/ignored 409 messages
- Integration: ops scripts run without depending on production secrets locally
- Regression: CI `quality-gates` remains green

## Observability and Audit Logging

- Audit events: none (uses existing AuditLog reads)
- Metrics:
  - `previewFailed409Expected`
  - `previewFailed409Mismatch`
  - `previewFailed409Ignored`
  - `previewAttemptsForGate`

## Rollback Plan

- Feature flag behavior: not applicable
- DB rollback method: none
- Recovery target time: revert script/workflow change

## Definition of Ready (DoR)

- [ ] Confirm which 409 messages should be gate-relevant.

## Definition of Done (DoD)

- [ ] phase2-health gate no longer fails on non-config 409 conflicts.
- [ ] Run log includes 409 message breakdown for triage.
- [ ] Spec/docs updated and CI passes.

