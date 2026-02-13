# WI-0005: Payroll Phase 2 Deductions and Tax Contract

## Background and Problem

FlowHR currently finalizes payroll at gross pay only.  
For production payroll readiness, deduction and tax components need a contract-first design that can be rolled out without breaking WI-0001 behavior.

## Scope

### In Scope

- Define Phase 2 payroll deduction/tax contract and compatibility policy.
- Add additive payroll data fields for deduction totals and net pay trace.
- Define feature-flagged API/event extensions for deduction preview and confirmation.
- Provide backward-compatibility matrix for existing WI-0001 consumers.

### Out of Scope

- Country-specific full tax engine implementation.
- External tax filing and remittance.
- Bank transfer payout execution.

## User Scenarios

1. Payroll operator reviews gross pay with deduction preview before confirmation.
2. Payroll operator confirms run with explicit deduction/tax breakdown trace.
3. Existing gross-pay-only consumers continue to work during migration window.

## Payroll Accuracy and Calculation Rules

- Source of truth: `specs/common/time-and-payroll-rules.md`.
- Phase 2 formula (contract):
  - `totalDeductionsKrw = withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw`
  - `netPayKrw = grossPayKrw - totalDeductionsKrw`
- KRW rounding remains integer at final amount.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| Run gross-only preview | Allow | Deny | Deny | Allow |
| Run deduction/tax preview | Allow | Deny | Deny | Allow |
| Confirm payroll with deduction trace | Allow | Deny | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables:
  - `PayrollRun`
- Migration IDs:
  - `202602130001_init_wi0001`
  - `202602130002_wi0001_api_extensions`
  - `202602140003_payroll_phase2_contract_base`
- Backward compatibility plan:
  - additive nullable columns only
  - preserve existing grossPayKrw semantics

## API and Event Changes

- Endpoints:
  - `POST /payroll/runs/preview` (v1 existing)
  - `POST /payroll/runs/preview-with-deductions` (phase2, feature flag)
  - `POST /payroll/runs/{runId}/confirm` (v1 existing)
- Events published:
  - `payroll.calculated.v1` (existing)
  - `payroll.confirmed.v1` (existing)
  - `payroll.deductions.calculated.v1` (phase2)
- Events consumed:
  - `attendance.approved.v1`
  - `attendance.corrected.v1`

## Test Plan

- Unit:
  - deduction aggregation and net pay formula
- Integration:
  - preview-with-deductions to confirm flow
- Regression:
  - gross-only WI-0001 regression remains green
- Authorization:
  - payroll_operator/admin-only phase2 operations
- Payroll accuracy:
  - deterministic total deduction and net pay output

## Observability and Audit Logging

- Audit events:
  - `payroll.calculated`
  - `payroll.deductions_calculated`
  - `payroll.confirmed`
- Metrics:
  - `payroll_deductions_preview_latency_ms`
  - `payroll_netpay_mismatch_count`
- Alert conditions:
  - deduction preview failure spike

## Rollback Plan

- Feature flag behavior:
  - disable `payroll_deductions_v1` and fallback to gross-only preview
- DB rollback method:
  - keep additive columns, stop phase2 writes
- Recovery target time:
  - 30 minutes

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Payroll contract phase boundary documented.
- [x] Backward-compatibility matrix prepared.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Phase 2 contract artifacts merged.
- [ ] Compatibility matrix reviewed by QA persona.
- [ ] Contract governance checks pass in CI.
- [ ] Gross-only regression remains green.
- [ ] ADR linked if architecture/compatibility changes are introduced.
