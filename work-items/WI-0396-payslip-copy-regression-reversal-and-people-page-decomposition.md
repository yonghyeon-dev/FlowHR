# WI-0396: Payslip copy regression reversal and people page decomposition

## Summary
- Resolved payslip page regression where recent i18n copy insertion grew `employee/payslips/page.tsx` instead of extracting locale copy.
- Moved compare insight/window copy handling into locale helpers and compare metric construction into shared helpers.
- Decomposed admin people page by extracting view and helpers:
  - `page.tsx` now focuses on state/orchestration
  - `page-view.tsx` contains UI sections
  - `page-types.ts`, `page-helpers.ts` contain reusable types/logic
- Brought `admin/people/page.tsx` under the 500-line target.

## Scope
- `src/app/employee/payslips/page.tsx`
- `src/app/employee/payslips/page-locale-helpers.ts`
- `src/app/employee/payslips/page-helpers.ts`
- `src/app/admin/people/page.tsx`
- `src/app/admin/people/page-view.tsx`
- `src/app/admin/people/page-types.ts`
- `src/app/admin/people/page-helpers.ts`
- `scripts/tests/e2e-wi0179-admin-people-bloat-section-removal.test.ts`
- `scripts/tests/e2e-wi0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.test.ts`
- `scripts/tests/e2e-wi0393-employee-payslips-utf8-encoding-guard.test.ts`
- `scripts/tests/e2e-wi0396-payslip-copy-regression-reversal-and-people-page-decomposition.test.ts`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0179-admin-people-bloat-section-removal.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0393-employee-payslips-utf8-encoding-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0396-payslip-copy-regression-reversal-and-people-page-decomposition.test.ts`
- `npm.cmd run -s typecheck`
