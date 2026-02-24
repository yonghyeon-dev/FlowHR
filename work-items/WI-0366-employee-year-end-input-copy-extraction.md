# WI-0366: Employee year-end input copy extraction

## Summary
- Extracted `/employee/year-end-input` locale copy/type block from `EmployeeYearEndInputConsole.tsx`.
- Added `employee-year-end-input-copy.ts` and rewired console import usage.
- Reduced inline component payload while keeping existing ko/en behavior unchanged.

## Scope
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `src/components/payroll-year-end/employee-year-end-input-copy.ts`
- `scripts/tests/e2e-wi0366-employee-year-end-input-copy-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0366-employee-year-end-input-copy-extraction.test.ts`
- `npm.cmd run -s typecheck`

