# WI-0878 Employee Dashboard Quick-Action Source Context

## Summary
- Added `source=employee-dashboard` to employee dashboard header quick actions for payslips and contracts.
- Kept quick-action IA and existing labels unchanged.

## Scope
- `src/components/employee-dashboard/EmployeeDashboardChrome.tsx`
- `scripts/tests/e2e-wi0878-employee-dashboard-quick-action-source-context.test.ts` (new)

## Acceptance
1. Dashboard quick action to payslips includes `source=employee-dashboard`.
2. Dashboard quick action to contracts includes `source=employee-dashboard`.
3. Existing quick-action labels and button ordering remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0878-employee-dashboard-quick-action-source-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0787-employee-dashboard-priority-action-panel.test.ts`
- `npm.cmd run build`
