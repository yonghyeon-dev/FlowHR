# WI-0705 Employee Guide/Account Session Identity Devtools Gate

## Summary
- gated read-only session identity metadata behind
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` in employee guide/account surfaces:
  - `src/components/employee-guide/EmployeeGuideSections.tsx`
  - `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- propagated `showDevTools` into guide context panel via:
  - `src/components/employee-guide/EmployeeGuideDashboard.tsx`
- kept employee page runtime behavior, period filters, and logs behavior unchanged.

## Scope
- UI exposure control only
- no API/schema/contract changes
- no ops route changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0705-employee-guide-account-session-identity-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0635-employee-guide-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0634-employee-root-session-context-productization.test.ts`
- `npm.cmd run typecheck`
