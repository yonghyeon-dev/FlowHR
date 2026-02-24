# WI-0367: Employee year-end input helper extraction

## Summary
- Extracted year-end input simulation/accuracy helper logic from `EmployeeYearEndInputConsole.tsx`.
- Added `employee-year-end-input-helpers.ts` for integer/rate parsing, simulation math, and guidance builder.
- Rewired console to use helper functions and reduced inline computational block size.

## Scope
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `src/components/payroll-year-end/employee-year-end-input-helpers.ts`
- `scripts/tests/e2e-wi0367-employee-year-end-input-helper-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0367-employee-year-end-input-helper-extraction.test.ts`
- `npm.cmd run -s typecheck`

