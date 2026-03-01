# WI-0712 Strict Devtools Gate for Session/Query Settings

## Summary
- removed non-production bypass (`showDevTools || !isProductionRuntime`) for
  session/query developer settings in:
  - `src/components/admin-dashboard/AdminOnboardingAccountPanels.tsx`
  - `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- enforced strict product behavior so those settings render only when
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` is enabled.
- preserved production state messaging and existing data refresh behavior.

## Scope
- dashboard productization only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0712-strict-devtools-gate-session-query-settings.test.ts`
- `npm.cmd run typecheck`
