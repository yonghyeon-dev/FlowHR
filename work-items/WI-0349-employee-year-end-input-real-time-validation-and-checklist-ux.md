# WI-0349: Employee year-end input real-time validation and checklist UX

## Summary
- Added real-time validation checks to employee year-end input console (`/employee/year-end-input`).
- Added checklist visualization with pass/fail count and per-check labels.
- Guarded finalized-settlement load action with core input validation (`year`, `employeeId`).

## Scope
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `scripts/tests/e2e-wi0349-employee-year-end-input-real-time-validation-and-checklist-ux.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0349-employee-year-end-input-real-time-validation-and-checklist-ux.test.ts`
