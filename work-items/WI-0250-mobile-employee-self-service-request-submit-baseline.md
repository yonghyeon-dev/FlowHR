# WI-0250: Mobile Employee Self-Service Request Submit Baseline

## Background

After WI-0249, employee mobile still lacked a direct request submission surface for core
self-service journeys. This WI adds a submit-first baseline for attendance correction and leave requests.

## Scope

### In Scope

- employee request domain helper baseline
  - `apps/mobile/src/lib/employeeRequest.js`
  - request type/leave unit option catalog
  - draft normalization + validation
  - request record factory + snapshot stats
- employee request persistence baseline
  - `apps/mobile/src/lib/employeeRequestStore.js`
  - secure-store load/save with normalization guard
- employee request submit screen baseline
  - `apps/mobile/src/screens/EmployeeRequestSubmitScreen.js`
  - attendance correction/leave request switch
  - form validation feedback + local submit
  - recent request list snapshot
- employee home + navigation wiring
  - `apps/mobile/src/screens/EmployeeHomeScreen.js`
  - `apps/mobile/src/navigation/RootNavigator.js`
  - quick actions route to submit screen (`attendanceCorrection`, `leaveRequest`)
- shell copy bump for next placeholder (`WI-0251~`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0250 e2e script

### Out of Scope

- backend leave/attendance write API integration
- manager approval decision integration
- request status sync from server events

## Validation

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
