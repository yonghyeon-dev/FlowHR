# WI-0348: Employee payslips explanation cards and month-over-month insight

## Summary
- Added month-over-month explanation cards to `/employee/payslips` compare view.
- Added compare insight helper (`buildCompareInsightCards`) to keep page logic compact.
- Extended compare snapshot payload with insight messages for operator handoff.

## Scope
- `src/app/employee/payslips/page.tsx`
- `src/app/employee/payslips/page-helpers.ts`
- `src/app/globals.css`
- `scripts/tests/e2e-wi0348-employee-payslips-explanation-cards-and-month-over-month-insight.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0348-employee-payslips-explanation-cards-and-month-over-month-insight.test.ts`
