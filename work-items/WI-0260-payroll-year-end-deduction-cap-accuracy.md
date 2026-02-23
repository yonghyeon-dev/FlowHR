# WI-0260: Payroll Year-End Deduction Cap Accuracy

## Background

`POST /payroll/year-end/recalculate-settlement` accepted deduction-item inputs, but
it did not expose explicit per-item cap application in the response payload. This
made it harder to verify year-end deduction behavior across recalculation,
finalization, and filing export.

## Scope

### In Scope

- year-end deduction cap model hardening in payroll service
  - add deterministic per-item cap rules for deduction-item inputs
  - apply caps before settlement tax-liability recalculation/finalization
  - expose total input deduction and capped deduction totals
  - expose per-item cap rule and cap-applied breakdown (`input`, `cap`, `applied`, `capped`)
- year-end response payload alignment
  - recalculate response includes cap totals and cap-applied breakdown
  - finalize response includes cap totals and cap-applied breakdown
  - export-filing-data response includes the finalized cap totals and cap-applied breakdown
- admin year-end console visibility
  - show capped deduction total
  - show human-readable summary of capped deduction items
- contract/spec/test-cases update and contract version bump (`1.40.0`)
- WI-0260 regression e2e
  - `scripts/tests/e2e-wi0260-payroll-year-end-deduction-cap-accuracy.test.ts`

### Out of Scope

- payroll close-period workflow changes
- filing submission state machine changes
- scheduler/cron or delivery-channel expansion
- mobile follow-up/preset layering

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0260-payroll-year-end-deduction-cap-accuracy.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0188-payroll-year-end-deduction-input-and-recalculation-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0190-payroll-year-end-export-format-expansion-and-validation-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
