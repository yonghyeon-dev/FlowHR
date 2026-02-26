# WI-0521: Mobile Employee Request API Integration with Local Fallback

## Summary
- Goal: connect mobile employee request flows to real FlowHR APIs while preserving offline/local fallback behavior.
- Scope:
  - `apps/mobile/src/lib/flowhrApi.js`
  - `apps/mobile/src/lib/employeeRequestApi.js`
  - `apps/mobile/src/lib/employeeRequestSync.js`
  - `apps/mobile/src/screens/EmployeeRequestSubmitScreen.js`
  - `apps/mobile/src/screens/EmployeeRequestHistoryScreen.js`
  - `apps/mobile/src/screens/EmployeeRequestFollowUpScreen.js`
  - `scripts/tests/e2e-wi0521-mobile-employee-request-api-integration-fallback.test.ts`
  - `ROADMAP.md`

## Delivery
- Extended mobile API header wiring:
  - added `x-actor-role` and `x-actor-organization-id` in `flowhrApi` client.
- Added employee request API bridge:
  - `fetchEmployeeRequestsFromApi` aggregates `/api/leave/requests` + `/api/attendance/records`.
  - `submitEmployeeRequestToApi` submits leave/attendance requests to real APIs.
  - API entities are mapped into existing mobile request model via `normalizeEmployeeRequestRecord`.
- Added sync helper:
  - `loadEmployeeRequestsWithApiFallback` tries API first, persists cache, and falls back to local store on failure.
- Updated mobile screens:
  - submit/history/follow-up screens now load request lists through API-first sync helper.
  - submit screen now posts to API first and falls back to local-only save when API fails.
  - added explicit "Sync API history" action in submit screen.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0521-mobile-employee-request-api-integration-fallback.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0250-mobile-employee-self-service-request-submit-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0251-mobile-employee-request-history-status-tracking-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0252-mobile-employee-request-notification-follow-up-baseline.test.ts`
- [x] `npm.cmd run typecheck`
