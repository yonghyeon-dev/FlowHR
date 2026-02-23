# WI-0251: Mobile Employee Request History/Status Tracking Baseline

## Background

WI-0250 added request submission, but employees still needed a dedicated history and status
tracking surface to monitor processing progress and follow-up actions.

## Scope

### In Scope

- employee request history/status domain helper baseline
  - `apps/mobile/src/lib/employeeRequest.js`
  - status catalog (`submitted`/`inReview`/`approved`/`rejected`/`canceled`)
  - request history filter/sort helpers
  - status transition timeline append helper
  - normalized record helper for store compatibility
- employee request store normalization upgrade
  - `apps/mobile/src/lib/employeeRequestStore.js`
  - status/timeline-aware record normalization
- employee request history screen baseline
  - `apps/mobile/src/screens/EmployeeRequestHistoryScreen.js`
  - search + request type/status filter + sort controls
  - snapshot KPI + request timeline list
  - local status transition actions (track baseline)
- employee journey wiring
  - `apps/mobile/src/screens/EmployeeHomeScreen.js`
  - `apps/mobile/src/screens/EmployeeRequestSubmitScreen.js`
  - `apps/mobile/src/navigation/RootNavigator.js`
  - history route and quick entry wiring
- shell copy bump for next placeholder (`WI-0252~`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0251 e2e script

### Out of Scope

- server-driven request status sync
- manager approval policy execution integration
- push notification trigger automation for each status transition

## Validation

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
