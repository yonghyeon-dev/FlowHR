# WI-0891 Employee Core Workspaces Production Session Gate and Dev-Link Cleanup

## Summary
- Applied a consistent product-mode login-session gate to employee notices, benefits, recruitment, schedule, and guide surfaces.
- Restricted employee `x-actor-*` header fallback to `showDevTools || !isProductionRuntime` only.
- Removed always-visible employee-to-admin shortcut exposure in benefits/recruitment and limited those links to devtools mode.

## Scope
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
- `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- `src/components/recruitment/EmployeeRecruitmentWorkspaceView.tsx`
- `src/components/scheduling/EmployeeScheduleBoard.tsx`
- `src/components/scheduling/EmployeeScheduleBoardView.tsx`
- `src/components/employee-guide/useEmployeeGuideData.ts`
- `src/components/employee-guide/EmployeeGuideDashboard.tsx`
- `scripts/tests/e2e-wi0891-employee-core-workspaces-production-session-gate-and-devlink-cleanup.test.ts` (new)

## Acceptance
1. In production runtime with devtools disabled and no bearer session, employee workspace fetch/mutation actions are blocked and `/login` guidance is shown.
2. Header-based fallback (`x-actor-role`, `x-actor-id`, `x-actor-organization-id`) remains available only in devtools mode or non-production runtime.
3. Employee benefits/recruitment headers no longer expose `/admin/*` shortcuts in product mode.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0710-employee-session-context-devtools-gate-core-workspaces.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0891-employee-core-workspaces-production-session-gate-and-devlink-cleanup.test.ts`
- `npm.cmd run build`
