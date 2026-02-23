# WI-0261: Payroll Year-End Tax Credit Cap Accuracy v1

## Background

Year-end settlement supported `additionalTaxCreditKrw`, but tax-credit behavior
was not structured as itemized cap-applied breakdown. This made tax-credit
explainability and replay verification weaker across preview/recalculation/
finalization/export.

## Scope

### In Scope

- year-end tax-credit cap model hardening
  - add deterministic tax-credit items:
    - `earnedIncomeTaxCreditKrw`
    - `childTaxCreditKrw`
    - `additionalTaxCreditKrw`
  - apply per-item cap rules and expose cap-applied breakdown
  - keep backward compatibility with existing `additionalTaxCreditKrw` input
- year-end settlement payload alignment
  - preview/recalculate/finalize/export settlement payload includes:
    - `totalTaxCreditInputKrw`
    - `totalTaxCreditAppliedKrw`
    - `taxCreditRulesKrw`
    - `taxCreditAppliedByItemKrw`
- admin year-end console update
  - tax-credit item inputs
  - cap-applied summary visibility
- spec/contract/test-cases update and contract version bump (`1.41.0`)
- WI-0261 regression e2e
  - `scripts/tests/e2e-wi0261-payroll-year-end-tax-credit-cap-accuracy-v1.test.ts`

### Out of Scope

- deduction-item cap rule changes (covered by WI-0260)
- filing submission state machine changes
- scheduler/cron/channel expansion
- mobile preset/follow-up layering

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0261-payroll-year-end-tax-credit-cap-accuracy-v1.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0187-payroll-year-end-withholding-receipt-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0188-payroll-year-end-deduction-input-and-recalculation-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0190-payroll-year-end-export-format-expansion-and-validation-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
