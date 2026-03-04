# WI-0875 Employee Recruitment Dashboard Source Entry

## Summary
- Added `source=employee-dashboard` context to employee dashboard recruitment shortcut links.
- Added source-entry hint and dashboard return action label in `/employee/recruitment`.
- Kept existing referral search/filter and submit/withdraw behavior unchanged.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- `src/components/recruitment/EmployeeRecruitmentWorkspaceView.tsx`
- `src/components/recruitment/employee-source-context.ts` (new)
- `scripts/tests/e2e-wi0875-employee-recruitment-dashboard-source-entry.test.ts` (new)

## Acceptance
1. Employee dashboard recruitment shortcut includes `source=employee-dashboard`.
2. `/employee/recruitment` reads source context and renders source-entry hint.
3. `/employee/recruitment` return action label switches to dashboard-context copy for dashboard source entries.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0875-employee-recruitment-dashboard-source-entry.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0823-employee-recruitment-deeplink-autoload.test.ts`
- `npm.cmd run build`
