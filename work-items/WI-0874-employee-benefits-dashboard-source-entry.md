# WI-0874 Employee Benefits Dashboard Source Entry

## Summary
- Added `source=employee-dashboard` context to employee dashboard benefits shortcut links.
- Added source-entry hint and dashboard return action label in `/employee/benefits`.
- Kept existing benefits filters and request submission/cancel behavior unchanged.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
- `src/components/benefits/employee-source-context.ts` (new)
- `scripts/tests/e2e-wi0874-employee-benefits-dashboard-source-entry.test.ts` (new)

## Acceptance
1. Employee dashboard benefits shortcut includes `source=employee-dashboard`.
2. `/employee/benefits` reads source context and renders source-entry hint.
3. `/employee/benefits` return action label switches to dashboard-context copy for dashboard source entries.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0874-employee-benefits-dashboard-source-entry.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0818-benefits-history-name-resolution-with-inactive-catalog.test.ts`
- `npm.cmd run build`
