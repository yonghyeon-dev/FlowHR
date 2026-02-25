# WI-0480: Korean Regression Suite Alignment After Payslips Decomposition

## Summary
- Goal: keep Korean regression guards green after payslips page decomposition moved UI tokens across files.
- Scope:
  - `scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
  - `scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
  - `scripts/tests/e2e-wi0480-korean-regression-suite-alignment-after-payslips-decomposition.test.ts`

## Delivery
- Rebased WI-0386 assertions to current copy source locations:
  - `withholding-receipt/copy-runtime.ts`
  - `payslip-receipts/copy.ts`
  - `contracts/copy.ts`
  - `payslips/page-view-filter-panel.tsx`
- Removed stale WI-0386 assumptions that expected Korean locale objects inside now-decomposed view files.
- Rebased WI-0416 runtime-label assertion from `page-view.tsx` to `page-view-filter-panel.tsx` and kept runtime/error-normalization checks intact.
- Added WI-0480 guard test to ensure legacy regression files track decomposed payslips layout and do not drift back to pre-split assumptions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0480-korean-regression-suite-alignment-after-payslips-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0471-korean-locale-employee-id-input-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0472-contracts-employee-id-locale-display-normalization.test.ts`
- [x] `npm.cmd run -s typecheck`
