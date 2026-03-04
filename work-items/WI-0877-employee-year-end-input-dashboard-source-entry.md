# WI-0877 Employee Year-End Input Dashboard Source Entry

## Summary
- Added `source=employee-dashboard` context to employee dashboard year-end input shortcut links.
- Added source-entry hint and dashboard return action label in `/employee/year-end-input`.
- Kept existing year-end simulation and validation checklist behavior unchanged.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- `src/components/payroll-year-end/employee-source-context.ts` (new)
- `scripts/tests/e2e-wi0877-employee-year-end-input-dashboard-source-entry.test.ts` (new)

## Acceptance
1. Employee dashboard year-end input shortcut includes `source=employee-dashboard`.
2. `/employee/year-end-input` reads source context and renders source-entry hint.
3. `/employee/year-end-input` return action label switches to dashboard-context copy for dashboard source entries.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0877-employee-year-end-input-dashboard-source-entry.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0631-employee-year-end-input-session-context-productization.test.ts`
- `npm.cmd run build`
