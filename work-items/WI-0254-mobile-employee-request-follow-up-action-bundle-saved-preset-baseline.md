# WI-0254: Mobile Employee Request Follow-Up Action Bundle Saved Preset Baseline

> **DEPRECATED (WI-0258)**: 모바일 적층 정리에서 follow-up action bundle/preset 레이어는 제거되었습니다.
> 참조: `docs/codex-guide.md` (Part 3 금지 규칙), `work-items/WI-0258-mobile-preset-layering-cleanup-baseline.md`

## Background

WI-0253 added follow-up template recommendations, but users still needed a faster way to
re-apply common follow-up filters and quick actions across sessions.

## Scope

### In Scope

- follow-up action bundle preset domain baseline
  - `apps/mobile/src/lib/employeeRequest.js`
  - bundle preset catalog (`allActionRequired`/`triageQueue`/`decisionQueue`/`recoveryQueue`)
  - bundle preset filter resolver + preset stats helper
  - preset state helpers (sanitize/toggle pin/recent push/normalize)
- follow-up preset persistence baseline
  - `apps/mobile/src/lib/employeeRequestStore.js`
  - follow-up preset state load/save with secure-store key
  - default pinned bundle presets
- follow-up screen bundle preset UX baseline
  - `apps/mobile/src/screens/EmployeeRequestFollowUpScreen.js`
  - pinned/recent preset chips
  - preset apply action (severity/status/sort/query sync)
  - preset quick-action run and pin/unpin
- shell placeholder bump (`WI-0255~`)
  - `apps/mobile/src/screens/EmployeeHomeScreen.js`
  - `apps/mobile/src/screens/AdminHomeScreen.js`
- docs and regression
  - WI doc
  - roadmap update
  - WI-0254 e2e script

### Out of Scope

- cross-device shared preset sync
- preset import/export payload exchange
- server-managed follow-up preset policy

## Validation

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
