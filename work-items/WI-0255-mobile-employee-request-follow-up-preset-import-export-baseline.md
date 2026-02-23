# WI-0255: Mobile Employee Request Follow-Up Preset Import/Export Baseline

> **DEPRECATED (WI-0258)**: 모바일 적층 정리에서 follow-up preset import/export 레이어는 제거되었습니다.
> 참조: `docs/codex-guide.md` (Part 3 금지 규칙), `work-items/WI-0258-mobile-preset-layering-cleanup-baseline.md`

## Background

WI-0254 introduced saved follow-up presets (pin/recent), but there was no way to transfer
preset state between devices or sessions.

## Scope

### In Scope

- follow-up preset transfer payload baseline
  - `apps/mobile/src/lib/employeeRequest.js`
  - transfer payload constants (`type`/`version`)
  - preset state serializer/parser (`serialize*`/`parse*`)
  - legacy state payload compatibility + validation errors
- follow-up preset import/export UI baseline
  - `apps/mobile/src/components/EmployeeRequestFollowUpPresetTransferCard.js`
  - payload generate/import/clear actions
  - invalid payload feedback and import success summary
- follow-up screen integration
  - `apps/mobile/src/screens/EmployeeRequestFollowUpScreen.js`
  - transfer card mount + imported preset persistence wiring
- shell placeholder bump (`WI-0256~`)
  - `apps/mobile/src/screens/EmployeeHomeScreen.js`
  - `apps/mobile/src/screens/AdminHomeScreen.js`
- docs and regression
  - WI doc
  - roadmap update
  - WI-0255 e2e script

### Out of Scope

- encrypted preset payload sharing
- server-side preset sync or tenant-shared presets
- transfer payload QR/deep-link flow

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0255-mobile-employee-request-follow-up-preset-import-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0254-mobile-employee-request-follow-up-action-bundle-saved-preset-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0253-mobile-employee-request-follow-up-template-recommendation-baseline.test.ts`
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
