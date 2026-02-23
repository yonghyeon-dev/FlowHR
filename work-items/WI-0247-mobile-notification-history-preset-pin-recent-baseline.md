# WI-0247: Mobile Notification History Preset Pin/Recent Baseline

## Background

WI-0246 added quick preset filters, but operators still need two productivity boosts:
stable pinned presets and automatic recent preset recall.

## Scope

### In Scope

- preset pin/recent helper baseline
  - `apps/mobile/src/lib/notificationHistory.js`
  - preset key sanitization
  - pin toggle helper
  - recent preset push helper (dedupe + max size)
- preset pin/recent persistence baseline
  - `apps/mobile/src/lib/notificationStore.js`
  - notification history preset state storage (`pinnedPresetKeys`, `recentPresetKeys`)
  - load/save API with normalization guard
- notification history preset UX upgrade
  - `apps/mobile/src/screens/NotificationHistoryScreen.js`
  - quick preset rows with pin/unpin action
  - pinned preset section
  - recent preset section
  - preset apply updates recent state and persists
- shell copy bump for next placeholder (`WI-0248~`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0247 e2e script

### Out of Scope

- cross-device/server-side preset sync
- user-specific preset sharing
- backend schema/API changes

## Validation

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
