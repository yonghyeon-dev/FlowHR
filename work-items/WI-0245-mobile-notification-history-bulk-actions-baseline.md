# WI-0245: Mobile Notification History Bulk Actions Baseline

## Background

After WI-0244 introduced a dedicated notification history screen, operators still need
batch actions to manage backlog efficiently on mobile.

## Scope

### In Scope

- notification history bulk helper baseline
  - extend `apps/mobile/src/lib/notificationHistory.js`
  - bulk action applier: mark read, archive, unarchive
  - selection utility helpers for stable visible-item selection
- notification history bulk UX
  - `apps/mobile/src/screens/NotificationHistoryScreen.js`
  - multi-select per history item
  - select-visible and clear-selection controls
  - bulk action controls for selected notifications
  - selected count and visible selected count summary
- shell copy bump for next placeholder (`WI-0246~`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0245 e2e script

### Out of Scope

- backend batch API endpoint
- retention policy scheduler
- push delivery contract changes

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0245-mobile-notification-history-bulk-actions-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0244-mobile-notification-history-search-archive-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0243-mobile-notification-center-realtime-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0242-mobile-email-template-engine-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0241-mobile-push-notification-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0240-mobile-app-shell-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
