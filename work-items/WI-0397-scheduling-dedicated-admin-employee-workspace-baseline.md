# WI-0397: Scheduling dedicated admin/employee workspace baseline

## Summary
- Added dedicated scheduling pages outside existing bloated core pages:
  - `/admin/scheduling`: schedule create/list/update/delete workspace.
  - `/employee/schedule`: employee own-schedule list and summary.
- Kept i18n dynamic by introducing locale copy bundles in a dedicated scheduling copy module.
- Updated shell navigation and i18n message keys to expose the new schedule routes.
- Enforced component-size guardrails by splitting admin scheduling UI into view + orchestrator files (both <= 300 lines).

## Scope
- `src/app/admin/scheduling/page.tsx`
- `src/app/employee/schedule/page.tsx`
- `src/components/scheduling/AdminSchedulingWorkspace.tsx`
- `src/components/scheduling/AdminSchedulingWorkspaceView.tsx`
- `src/components/scheduling/EmployeeScheduleBoard.tsx`
- `src/components/scheduling/copy.ts`
- `src/components/scheduling/helpers.ts`
- `src/app/admin/layout.tsx`
- `src/app/employee/layout.tsx`
- `src/lib/i18n/messages.ts`
- `scripts/tests/e2e-wi0397-scheduling-dedicated-admin-employee-workspace-baseline.test.ts`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0397-scheduling-dedicated-admin-employee-workspace-baseline.test.ts`
- `npm.cmd run -s typecheck`
