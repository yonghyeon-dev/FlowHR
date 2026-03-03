# WI-0871 Employee Payslips Dashboard Source Entry

## Summary
- Added source-context hydration in `/employee/payslips` for `source=employee-dashboard`.
- Added source-entry hint banner on payslips page header when opened from employee dashboard.
- Added context-aware return label in payslips header actions (`Back to dashboard` / `대시보드로 돌아가기`) while keeping default employee portal action for non-source entries.

## Scope
- `src/app/employee/payslips/page.tsx`
- `src/app/employee/payslips/page-view.tsx`
- `src/app/employee/payslips/page-view-types.ts`
- `src/app/employee/payslips/page-view-filter-panel.tsx`
- `scripts/tests/e2e-wi0871-employee-payslips-dashboard-source-entry.test.ts` (new)

## Acceptance
1. `/employee/payslips` reads `source` query param and recognizes `employee-dashboard`.
2. Payslips header displays source-entry hint when opened from employee dashboard.
3. Payslips header primary return action label changes to dashboard return copy for dashboard-source entry.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0871-employee-payslips-dashboard-source-entry.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0785-employee-dashboard-hub-ia-simplification.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0793-employee-payslips-admin-shortcut-devtools-gate.test.ts`
- `npm.cmd run build`
