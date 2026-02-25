# WI-0479: Payslips Page-Helpers and Derived-State Budget Split

## Summary
- Goal: continue payslips decomposition by reducing helper-file bloat while keeping behavior unchanged.
- Scope:
  - `src/app/employee/payslips/page-helpers.ts`
  - `src/app/employee/payslips/page-compare-helpers.ts`
  - related legacy regression tests that referenced pre-split helper layout

## Delivery
- Extracted compare/insight computation helpers from `page-helpers.ts` into:
  - `src/app/employee/payslips/page-compare-helpers.ts`
- Kept existing imports stable via re-export in `page-helpers.ts`:
  - `buildCompareMetrics`
  - `buildCompareInsightCards`
  - `formatPercent`
- Updated legacy payslip decomposition regressions to accept extracted helper layout without relaxing coverage:
  - `scripts/tests/e2e-wi0396-payslip-copy-regression-reversal-and-people-page-decomposition.test.ts`
  - `scripts/tests/e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test.ts`
- Line budget outcome:
  - `page-helpers.ts` 394 -> 230
  - `page-compare-helpers.ts` 179

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0479-payslips-page-helpers-and-derived-state-budget-split.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0318-employee-payslips-locale-helper-split-phase6.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0319-employee-payslips-locale-dynamic-residual-gap-fix-phase7.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0396-payslip-copy-regression-reversal-and-people-page-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0478-payslips-page-view-filter-list-panel-decomposition.test.ts`
- [x] `npm.cmd run -s typecheck`
