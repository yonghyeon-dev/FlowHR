# WI-0246: Mobile Notification History Quick Preset Filters Baseline

> **DEPRECATED (WI-0258)**: 모바일 적층 정리에서 quick preset 레이어는 제거되었습니다.
> 참조: `docs/codex-guide.md` (Part 3 금지 규칙), `work-items/WI-0258-mobile-preset-layering-cleanup-baseline.md`

## Background

WI-0245 delivered bulk actions, but operators still spend time repeatedly setting
the same filter combinations in notification history.

## Scope

### In Scope

- notification history preset filter catalog and resolver
  - `apps/mobile/src/lib/notificationHistory.js`
  - preset definitions (`allOpen`, `approvalUnread`, `resultUnread`, `payslipUnread`, `archived`)
  - preset filter resolver and preset-count helper
- notification history quick preset UX
  - `apps/mobile/src/screens/NotificationHistoryScreen.js`
  - quick preset chip group with per-preset item counts
  - active preset indicator
  - manual filter changes automatically switching to `custom` preset state
- shell copy bump for next placeholder (`WI-0247~`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0246 e2e script

### Out of Scope

- server-side saved presets
- preset synchronization across users/devices
- notification contract/schema changes

## Validation

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
