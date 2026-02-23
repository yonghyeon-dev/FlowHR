# WI-0248: Mobile Notification History Preset Import/Export Baseline

> **DEPRECATED (WI-0258)**: 모바일 적층 정리에서 preset import/export 레이어는 제거되었습니다.
> 참조: `docs/codex-guide.md` (Part 3 금지 규칙), `work-items/WI-0258-mobile-preset-layering-cleanup-baseline.md`

## Background

WI-0247 added preset pin/recent persistence, but operators still need a shareable transfer path
to move preset state between devices and sessions.

## Scope

### In Scope

- preset transfer serialization/parser baseline
  - `apps/mobile/src/lib/notificationHistory.js`
  - transfer payload schema (`type`, `version`, `exportedAt`, `state`)
  - import parser with validation/error code (`empty_payload`, `invalid_json`, `unsupported_type`, ...)
  - legacy direct-state payload compatibility
- preset transfer UI baseline
  - `apps/mobile/src/components/NotificationPresetTransferCard.js`
  - export payload generation
  - import payload application
  - transfer status feedback (success/error)
- notification history wiring upgrade
  - `apps/mobile/src/screens/NotificationHistoryScreen.js`
  - transfer card wiring + imported preset persistence
- shell copy bump for next placeholder (`WI-0249~`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0248 e2e script

### Out of Scope

- server-side preset sync API
- encrypted preset share links
- device-to-device clipboard automation

## Validation

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
