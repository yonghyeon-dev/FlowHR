# WI-0873 Employee Notices Dashboard Source Entry

## Summary
- Added `source=employee-dashboard` context to employee dashboard notice shortcut links.
- Added source-entry hint and dashboard return action in `/employee/notices`.
- Kept existing notice filters and unread actions unchanged.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `src/components/notices/employee-source-context.ts` (new)
- `scripts/tests/e2e-wi0873-employee-notices-dashboard-source-entry.test.ts` (new)

## Acceptance
1. Employee dashboard notices shortcut includes `source=employee-dashboard`.
2. `/employee/notices` reads source context and renders source-entry hint.
3. `/employee/notices` header action label switches to dashboard return copy for dashboard source entries.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0873-employee-notices-dashboard-source-entry.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0527-employee-notice-read-status-filter-and-line-budget.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- `npm.cmd run build`
