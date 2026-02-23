# WI-0244: Mobile Notification History Search/Archive Baseline

## Background

Phase 7 next step after WI-0243 adds dedicated history operations to mobile notifications.
The realtime center should stay focused on active feed updates, while search and archive actions
move into a separate screen to prevent page bloat.

## Scope

### In Scope

- notification history helper baseline
  - `apps/mobile/src/lib/notificationHistory.js`
  - query/category/read/archive filtering
  - snapshot stats
  - archive/unarchive mutation helper
- notification history mobile screen
  - `apps/mobile/src/screens/NotificationHistoryScreen.js`
  - keyword search input
  - category/read/archive chip filters
  - archive and unarchive actions per item
  - inbox snapshot and refresh action
- shell navigation wiring
  - `RootNavigator` route for `NotificationHistory`
  - quick entry actions from admin/employee home and notification center
- docs and regression
  - WI doc
  - roadmap update
  - WI-0244 e2e script

### Out of Scope

- backend archive API or schema changes
- websocket/sse streaming implementation
- bulk archive policy automation

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0244-mobile-notification-history-search-archive-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0243-mobile-notification-center-realtime-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0242-mobile-email-template-engine-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0241-mobile-push-notification-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
