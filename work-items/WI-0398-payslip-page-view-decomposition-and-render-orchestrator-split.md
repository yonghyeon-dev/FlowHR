# WI-0398: Payslip Page View Decomposition and Render-Orchestrator Split

## Summary
- Split `/employee/payslips` into render and orchestrator layers to stop `page.tsx` growth.
- Added `src/app/employee/payslips/page-view.tsx` for UI rendering and retained state/query/copy orchestration in `page.tsx`.
- Reduced `src/app/employee/payslips/page.tsx` line count from 1246 to 748 while keeping locale helper and compare insight flows intact.
- Kept `src/app/admin/people/page.tsx` below 500 lines as a guard against decomposition regression.

## Scope
- `src/app/employee/payslips/page.tsx`
- `src/app/employee/payslips/page-view.tsx`
- `scripts/tests/e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test.ts`
- `ROADMAP.md`
- `package.json`

## Validation
- `npm.cmd run -s typecheck`
- `npm.cmd exec tsx scripts/tests/e2e-wi0398-payslip-page-view-decomposition-and-render-orchestrator-split.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0396-payslip-copy-regression-reversal-and-people-page-decomposition.test.ts`
- `npm.cmd exec tsx scripts/tests/page-composition-guard.test.ts`
