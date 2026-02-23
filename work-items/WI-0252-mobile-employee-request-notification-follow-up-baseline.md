# WI-0252: Mobile Employee Request Notification/Follow-Up Baseline

## Background

WI-0251 provided request history and status tracking, but employees still lacked a dedicated
follow-up inbox for status-driven alerts and quick response actions.

## Scope

### In Scope

- employee request follow-up domain helper baseline
  - `apps/mobile/src/lib/employeeRequest.js`
  - follow-up severity/sort catalogs
  - status-driven follow-up inbox builder
  - follow-up stats/filter/sort formatting helpers
- employee request follow-up screen baseline
  - `apps/mobile/src/screens/EmployeeRequestFollowUpScreen.js`
  - search + severity/status filters + priority/newest sort
  - quick status actions (move/reopen/approve/reject)
  - request history / request submit shortcut actions
  - dismiss/reset local alert flow
- employee mobile journey wiring
  - `apps/mobile/src/navigation/RootNavigator.js`
  - `apps/mobile/src/screens/EmployeeHomeScreen.js`
  - `apps/mobile/src/screens/EmployeeRequestHistoryScreen.js`
  - `apps/mobile/src/screens/EmployeeRequestSubmitScreen.js`
  - follow-up route + action callbacks + quick entry
- placeholder bump for next shell marker (`WI-0253~`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0252 e2e script

### Out of Scope

- server push/webhook sync for follow-up alerts
- automated manager-side policy execution or escalation
- cross-device synced dismissed follow-up state

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0252-mobile-employee-request-notification-follow-up-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0251-mobile-employee-request-history-status-tracking-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0250-mobile-employee-self-service-request-submit-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0249-mobile-admin-approval-queue-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0248-mobile-notification-history-preset-import-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0247-mobile-notification-history-preset-pin-recent-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0246-mobile-notification-history-quick-preset-filters-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0245-mobile-notification-history-bulk-actions-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0244-mobile-notification-history-search-archive-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0243-mobile-notification-center-realtime-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0242-mobile-email-template-engine-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0241-mobile-push-notification-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0240-mobile-app-shell-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
