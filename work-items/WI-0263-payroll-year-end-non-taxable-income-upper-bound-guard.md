# WI-0263: Payroll Year-End Non-Taxable Income Upper-Bound Guard

## Background

Year-end settlement accepted non-taxable annual income input without checking
whether it exceeded annual gross pay. This could hide invalid taxable-base
assumptions and reduce operator trust in settlement outputs.

## Scope

### In Scope

- year-end non-taxable annual income upper-bound validation
  - enforce `nonTaxableAnnualIncomeKrw <= annualGrossPayKrw` for selected employee/year
  - block invalid requests deterministically with explicit guard details
- service guard coverage
  - apply guard consistently to:
    - `POST /payroll/year-end/preview-settlement`
    - `POST /payroll/year-end/recalculate-settlement`
    - `POST /payroll/year-end/finalize-settlement`
- spec/contract/test-cases update and contract version bump (`1.43.0`)
- WI-0263 regression e2e
  - `scripts/tests/e2e-wi0263-payroll-year-end-non-taxable-income-upper-bound-guard.test.ts`

### Out of Scope

- deduction-item cap rule changes (covered by WI-0260)
- tax-credit cap rule changes (covered by WI-0261)
- deduction eligibility model changes (covered by WI-0262)
- filing submission state-machine changes

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0263-payroll-year-end-non-taxable-income-upper-bound-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0187-payroll-year-end-withholding-receipt-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0188-payroll-year-end-deduction-input-and-recalculation-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0262-payroll-year-end-deduction-eligibility-validation-guards.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
