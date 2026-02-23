# WI-0262: Payroll Year-End Deduction Eligibility Validation Guards

## Background

Year-end deduction inputs were normalized and capped, but eligibility intent
was not explicitly represented in recalculation/finalization requests. This
made it difficult to block clearly ineligible deduction entries at request time.

## Scope

### In Scope

- deduction eligibility input model for year-end recalculation/finalization
  - add `deductionEligibility` flags for each deduction item:
    - `personalPensionEligible`
    - `insurancePremiumEligible`
    - `medicalExpenseEligible`
    - `educationExpenseEligible`
    - `donationEligible`
    - `housingSavingsEligible`
- eligibility guard in service layer
  - reject recalculation/finalization when an ineligible item has non-zero deduction input
  - return deterministic blocking reasons
- response explainability
  - include normalized eligibility and eligibility blocking reasons in recalculation/finalization payloads
- admin year-end console update
  - expose per-item eligibility toggles for operator validation
- spec/contract/test-cases update and contract version bump (`1.42.0`)
- WI-0262 regression e2e
  - `scripts/tests/e2e-wi0262-payroll-year-end-deduction-eligibility-validation-guards.test.ts`

### Out of Scope

- deduction cap rule updates (already covered by WI-0260)
- tax-credit cap rule updates (already covered by WI-0261)
- filing submission workflow state-machine changes
- scheduler/ops channel expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0262-payroll-year-end-deduction-eligibility-validation-guards.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0188-payroll-year-end-deduction-input-and-recalculation-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0261-payroll-year-end-tax-credit-cap-accuracy-v1.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
