# WI-0876 Employee Schedule Dashboard Source Entry

## Summary
- Added `source=employee-dashboard` context to employee dashboard schedule shortcut links.
- Added source-entry hint and dashboard return action label in `/employee/schedule`.
- Kept existing schedule filters, exports, and attendance correction CTA behavior unchanged.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `src/components/scheduling/EmployeeScheduleBoardView.tsx`
- `src/components/scheduling/employee-source-context.ts` (new)
- `scripts/tests/e2e-wi0876-employee-schedule-dashboard-source-entry.test.ts` (new)

## Acceptance
1. Employee dashboard schedule shortcut includes `source=employee-dashboard`.
2. `/employee/schedule` reads source context and renders source-entry hint.
3. `/employee/schedule` return action label switches to dashboard-context copy for dashboard source entries.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0876-employee-schedule-dashboard-source-entry.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0588-employee-schedule-conflict-quick-correction-action.test.ts`
- `npm.cmd run build`
