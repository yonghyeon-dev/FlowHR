# WI-0010: Payroll Profile Version Guard for Deduction Preview

## Background and Problem

Profile-mode deduction preview currently uses the latest profile version by `profileId`.  
When operators prepare a run with an older profile snapshot, a silent profile update can change net pay unexpectedly.

## Scope

### In Scope

- Add optional `expectedProfileVersion` to profile-mode preview request.
- Reject preview when expected version and current profile version do not match.
- Extend memory/prisma e2e tests for stale-version rejection and successful retry.

### Out of Scope

- DB schema change for version locking.
- Multi-profile fallback selection logic.
- Legal tax rule engine expansion.

## User Scenarios

1. Payroll operator requests profile-mode preview with expected version and receives deterministic result.
2. Payroll operator requests profile-mode preview with stale expected version and receives `409`.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: profile mode reads current profile by ID and validates expected version when provided.
- Rounding rule: existing KRW rounding behavior remains unchanged.
- Exception handling rule: stale profile mismatch returns `409 deduction profile version mismatch`.

## Authorization and Role Matrix

| Action | Admin | Payroll Operator | Manager | Employee |
| --- | --- | --- | --- | --- |
| Run profile-mode preview with expected version | Allow | Allow | Deny | Deny |
| Confirm payroll run | Allow | Allow | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables: `DeductionProfile`, `PayrollRun`, `AuditLog`
- Migration IDs: none
- Backward compatibility plan: additive request field only; existing callers remain valid

## API and Event Changes

- Endpoints:
  - `POST /api/payroll/runs/preview-with-deductions` (optional `expectedProfileVersion`)
- Events published:
  - no new event type; existing `payroll.deductions.calculated.v1` reused
- Events consumed:
  - none

## Test Plan

- Unit:
  - profile version mismatch guard logic
- Integration:
  - stale version request returns `409`
  - matching version request succeeds
- Regression:
  - WI-0006 memory/prisma e2e remains green
- Authorization:
  - payroll role enforcement unchanged
- Payroll accuracy:
  - successful profile-mode preview keeps deterministic deduction/net pay totals

## Observability and Audit Logging

- Audit events:
  - `payroll.preview_with_deductions.failed` (stale version path)
  - `payroll.deductions_calculated` (success path)
- Metrics:
  - `payroll_deduction_profile_miss_count`
- Alert conditions:
  - stale-version reject spike

## Rollback Plan

- Feature flag behavior: disable `payroll_deduction_profile_v1` if guard causes operational issues.
- DB rollback method: not applicable (no migration).
- Recovery target time: 30m.

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
