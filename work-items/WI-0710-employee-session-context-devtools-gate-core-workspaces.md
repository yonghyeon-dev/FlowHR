# WI-0710 Employee Session Context Devtools Gate (Core Workspaces)

## Summary
- hid employee session identifiers in product mode and exposed them only under
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` for core employee-facing workspaces:
  - `src/components/employee-guide/EmployeeGuideSections.tsx`
  - `src/components/notices/EmployeeNoticeBoard.tsx`
  - `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
  - `src/components/recruitment/EmployeeRecruitmentWorkspaceView.tsx`
  - `src/components/scheduling/EmployeeScheduleBoardView.tsx`
- propagated `showDevTools` state where needed from workspace containers.
- preserved API/auth request behavior and business logic.

## Scope
- employee core workspace productization only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0710-employee-session-context-devtools-gate-core-workspaces.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0635-employee-guide-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0620-notice-benefits-recruitment-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0621-employee-schedule-session-context-productization.test.ts`
- `npm.cmd run typecheck`
