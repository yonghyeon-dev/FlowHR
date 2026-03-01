# WI-0698 Employee Workspace Session Identity Devtools Gate

## Summary
- gated read-only session identity metadata (`organizationId`, `employeeId`) behind
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` on employee workspaces:
  - `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
  - `src/components/recruitment/EmployeeRecruitmentWorkspaceView.tsx`
- added `showDevTools` propagation on orchestration components:
  - `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
  - `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- preserved runtime session-based auth and request behavior; only default UI
  exposure changed.

## Scope
- employee workspace UI exposure control only
- no API/schema/contract changes
- no admin/ops route behavior changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0698-employee-workspace-session-identity-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0620-notice-benefits-recruitment-session-context-productization.test.ts`
- `npm.cmd run typecheck`
