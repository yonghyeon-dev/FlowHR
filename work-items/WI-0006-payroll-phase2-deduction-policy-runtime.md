# WI-0006: Payroll Phase2 Deduction Policy Runtime

## Background and Problem

FlowHR currently supports phase2 deduction preview only when deduction values are explicitly provided per request.  
For operational stability, payroll operators need a reusable policy profile so deduction calculations are deterministic and auditable without manual per-run inputs.

## Scope

### In Scope

- Define deduction profile contract and auto-calculation mode for payroll phase2.
- Add profile CRUD API contract and authorization constraints.
- Add payroll preview mode selection (`manual` or `profile`) with audit trace requirements.
- Extend regression and golden datasets with deduction-profile scenario.

### Out of Scope

- Full legal/tax rule engine by jurisdiction.
- External filing/remittance integrations.
- Retroactive statutory recalculation automation.

## User Scenarios

1. Payroll operator stores a default deduction profile per organization/employee segment.
2. Payroll operator runs phase2 preview using profile mode without passing raw deduction amounts.
3. Auditor can trace which profile version produced confirmed net pay.

## Payroll Accuracy and Calculation Rules

- Source of truth: `specs/common/time-and-payroll-rules.md`.
- Mode rules:
  - `manual`: use request deduction values.
  - `profile`: derive deduction values from approved profile rates/fixed amounts.
- Invariant:
  - `totalDeductionsKrw` must equal the sum of all persisted deduction components.
  - `netPayKrw = grossPayKrw - totalDeductionsKrw`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| Create/update deduction profile | Allow | Deny | Deny | Allow |
| Run phase2 preview (manual mode) | Allow | Deny | Deny | Allow |
| Run phase2 preview (profile mode) | Allow | Deny | Deny | Allow |
| Confirm payroll with profile trace | Allow | Deny | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables:
  - `DeductionProfile` (new)
  - `PayrollRun` (add profile trace fields)
- Migration IDs:
  - `202602140004_payroll_phase2_deduction_profile`
- Backward compatibility plan:
  - additive-only table/columns
  - keep existing manual phase2 path valid

## API and Event Changes

- Endpoints:
  - `PUT /payroll/deduction-profiles/{profileId}`
  - `GET /payroll/deduction-profiles/{profileId}`
  - `POST /payroll/runs/preview-with-deductions` (mode extension)
- Events published:
  - `payroll.deduction_profile.updated.v1`
  - `payroll.deductions.calculated.v1` (extended payload)
- Events consumed:
  - `attendance.approved.v1`
  - `attendance.corrected.v1`

## Test Plan

- Unit:
  - profile-based deduction calculation
  - mode validation and invariant checks
- Integration:
  - profile CRUD authorization and retrieval
  - profile-mode preview to confirm flow
- Regression:
  - WI-0001/WI-0005 gross/manual path remains green
  - golden case `GC-006` validated
- Authorization:
  - manager/employee denied for profile mutation and payroll preview
- Payroll accuracy:
  - profile rate + fixed amount aggregation determinism

## Observability and Audit Logging

- Audit events:
  - `payroll.deduction_profile.updated`
  - `payroll.deductions_calculated`
  - `payroll.confirmed`
- Metrics:
  - `payroll_deduction_profile_calc_latency_ms`
  - `payroll_deduction_profile_miss_count`
- Alert conditions:
  - profile-mode preview failure spike

## Rollback Plan

- Feature flag behavior:
  - disable profile mode while keeping manual mode enabled
- DB rollback method:
  - stop writes to `DeductionProfile`, keep additive schema
- Recovery target time:
  - 30 minutes

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [x] Runtime supports profile mode behind feature flag.
- [x] Profile CRUD auth and audit coverage implemented.
- [x] Required tests pass and golden regression is green.
- [ ] QA Spec Gate and Code Gate are both passed.
- [x] ADR linked for profile-mode architecture decision.
