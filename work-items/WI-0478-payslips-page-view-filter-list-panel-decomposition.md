# WI-0478: Payslips Page-View Filter/List Panel Decomposition

## Summary
- Goal: reduce `payslips` page-view bloat and keep component-level line budget guard.
- Scope:
  - `src/app/employee/payslips/page-view.tsx`
  - `src/app/employee/payslips/page-view-filter-panel.tsx`
  - `src/app/employee/payslips/page-view-run-list-panel.tsx`
  - `src/app/employee/payslips/page-view-types.ts`

## Delivery
- Extracted filter/devtools/attendance panel and top-page hero/KPI section into:
  - `src/app/employee/payslips/page-view-filter-panel.tsx`
- Extracted payslip run list panel into:
  - `src/app/employee/payslips/page-view-run-list-panel.tsx`
- Extracted page-view prop/type blocks into:
  - `src/app/employee/payslips/page-view-types.ts`
- Rewired `src/app/employee/payslips/page-view.tsx` to orchestration-only composition.
- Line budget outcome:
  - `page-view.tsx` 461 -> 209
  - `page-view-filter-panel.tsx` 242
  - `page-view-run-list-panel.tsx` 58

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0478-payslips-page-view-filter-list-panel-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0318-employee-payslips-locale-helper-split-phase6.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0319-employee-payslips-locale-dynamic-residual-gap-fix-phase7.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0450-payslips-page-api-hook-extraction-and-line-budget-500.test.ts`
- [x] `npm.cmd run -s typecheck`
