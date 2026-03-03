# WI-0872 Employee Contracts Dashboard Return Action

## Summary
- Added dashboard-source context resolver for `/employee/contracts`.
- Kept the existing source-entry hint and added a header return action to `/employee` when opened via `source=employee-dashboard`.
- Kept default behavior unchanged for non-dashboard entries.

## Scope
- `src/components/contracts/EmployeeContractsInbox.tsx`
- `src/components/contracts/employee-source-context.ts` (new)
- `scripts/tests/e2e-wi0872-employee-contracts-dashboard-return-action.test.ts` (new)

## Acceptance
1. `/employee/contracts?source=employee-dashboard` keeps showing source-entry hint copy.
2. The contracts header shows a `Back to dashboard`/`대시보드로 돌아가기` action only for dashboard-source entries.
3. Non-dashboard entries do not render the dashboard return action.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0872-employee-contracts-dashboard-return-action.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0844-employee-contracts-source-entry-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0843-employee-contracts-source-context-shortcuts.test.ts`
- `npm.cmd run build`
