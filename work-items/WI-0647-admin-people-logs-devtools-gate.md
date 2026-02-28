# WI-0647 Admin People Logs Devtools Gate

## Summary
- gated `/admin/people` request logs panel behind `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`
- added `showDevTools` runtime flag in `src/app/admin/people/page.tsx` and passed it down to page view
- updated `src/app/admin/people/page-view.tsx` to conditionally render:
  - devtools on: `AdminPeopleLogsPanel`
  - devtools off: product-facing `Related workspaces` navigation panel
- preserved existing people page decomposition structure and core directory/history workflows

## Scope
- admin people surface UX hardening only
- no API/schema/contract changes
- no ops scheduler/automation expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0618-admin-dashboard-productization-and-session-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0647-admin-people-logs-devtools-gate.test.ts`
