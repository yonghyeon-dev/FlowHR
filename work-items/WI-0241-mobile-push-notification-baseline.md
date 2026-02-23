# WI-0241: Mobile Push Notification Baseline

## Background

Phase 7 `WI-U` follows WI-0240 mobile shell with notification capability.
Users need mobile-first status updates (approval requests/results, payslip readiness) and a basic
notification center to manage permission and preferences.

## Scope

### In Scope

- mobile notification bootstrap module
  - `apps/mobile/src/lib/notifications.js`
  - Expo notification permission request and token registration baseline
- notification preference/inbox store
  - `apps/mobile/src/lib/notificationStore.js`
  - secure-store persistence with in-memory fallback
- notification center screen
  - `apps/mobile/src/screens/NotificationCenterScreen.js`
  - permission status, preference toggles, recent notification list, mark-all-read action
- shell route integration
  - Admin/Employee home screens provide entry to notification center
  - root navigator route registration
- docs and guardrails
  - WI doc
  - roadmap update
  - WI-0241 regression test script

### Out of Scope

- production push delivery backend (FCM/APNs server orchestration)
- domain contract/API changes
- notification analytics pipeline

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0241-mobile-push-notification-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
