# WI-0365: Employee year-end input UX accuracy guidance improvements

## Summary
- Improved `/employee/year-end-input` validation UX by moving inline labels to locale copy keys.
- Added an accuracy guidance section that surfaces cap-application adjustments, non-taxable guard correction, and liability/due/refund direction.
- Updated KRW formatter usage to apply runtime locale formatting in simulation summaries.

## Scope
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `src/components/withholding-receipt/types.ts`
- `scripts/tests/e2e-wi0365-employee-year-end-input-ux-accuracy-guidance-improvements.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0365-employee-year-end-input-ux-accuracy-guidance-improvements.test.ts`
- `npm.cmd run -s typecheck`

