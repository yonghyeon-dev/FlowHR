# WI-0188: Payroll Year-End Deduction Input and Recalculation Baseline

## Background and Problem

FlowHR already supports year-end settlement preview and withholding receipt issue workflow, but payroll operators cannot input deduction items and compare recalculated annual settlement deltas in one step.
To continue Phase 4 payroll compliance flow with customer-facing value, WI-0188 adds deduction-item input and recalculation API/UX for year-end settlement.

## Scope

### In Scope

- Add year-end recalculation API:
  - `POST /payroll/year-end/recalculate-settlement`
  - employee/year scoped deduction-item input
  - baseline vs recalculated settlement comparison (taxable income, tax liability, withholding delta)
- Add payroll service logic:
  - feature flag gate (`FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1`)
  - permission and tenant boundary guard (`payrollRunConfirm`)
  - deterministic deduction-input normalization and bounded application
  - audit/domain event publication for recalculation and failure telemetry
- Extend admin year-end UI:
  - `/admin/payroll-year-end` deduction input fields and recalculation panel
  - baseline/recalculated tax-liability and withholding-delta comparison
- Add WI-0188 regression test:
  - `scripts/tests/e2e-wi0188-payroll-year-end-deduction-input-and-recalculation-baseline.test.ts`
- Wire WI-0188 into MVP/FULL e2e chains
- Update payroll specs (contract/api/test-cases)

### Out of Scope

- Government filing integration or e-filing submission workflow
- Automated deduction recommendation engine
- Batch multi-employee recalculation scheduler

## User Scenarios

1. Payroll operator enters deduction items for a selected employee/year and recalculates annual settlement.
2. Payroll operator reviews baseline vs recalculated tax-liability and withholding-delta changes before deciding issue actions.
3. Unauthorized actor cannot trigger year-end recalculation.

## Data Changes

- New APIs:
  - POST /payroll/year-end/recalculate-settlement
- Updated model:
  - `PayrollRun` (read-only annual aggregation reused for recalculation baseline)
- DB migration:
  - none (service and API extension only)

## Rollback Plan

- Disable `FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1`
- Revert year-end recalculation route/service/schema changes
- Revert admin year-end UI recalculation fields and summary panel
- Revert payroll spec and e2e updates

## Definition of Done (DoD)

- [x] Year-end deduction-item recalculation returns deterministic baseline-vs-recalculated delta summary.
- [x] Recalculation enforces payroll permission and tenant boundary guards.
- [x] Admin year-end route provides dedicated deduction input and recalculation comparison UX.
- [x] Payroll contract/api/test-cases include new recalculation endpoint, invariants, and feature flag.
- [x] WI-0188 regression test exists and is wired into MVP/FULL suites.
