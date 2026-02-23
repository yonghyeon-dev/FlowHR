# WI-0253: Mobile Employee Request Follow-Up Template Recommendation Baseline

> **DEPRECATED (WI-0258)**: 모바일 적층 정리에서 follow-up template recommendation 레이어는 제거되었습니다.
> 참조: `docs/codex-guide.md` (Part 3 금지 규칙), `work-items/WI-0258-mobile-preset-layering-cleanup-baseline.md`

## Background

WI-0252 introduced follow-up alerts and quick actions, but follow-up handling still required
manual action choices per item. A lightweight recommendation template layer is needed to speed
up consistent decisions.

## Scope

### In Scope

- follow-up template recommendation helper baseline
  - `apps/mobile/src/lib/employeeRequest.js`
  - recommendation template catalog (`triage`/`decision`/`recovery`/`closure`)
  - status-to-template recommendation helper
  - template usage stats builder
- follow-up recommendation UI baseline
  - `apps/mobile/src/screens/EmployeeRequestFollowUpScreen.js`
  - recommendation template section (template count + guide note)
  - quick apply for recommended primary/secondary action to first matching follow-up
  - per-alert recommended template labeling + recommend action shortcut
- shell placeholder bump (`WI-0254~`)
  - `apps/mobile/src/screens/EmployeeHomeScreen.js`
  - `apps/mobile/src/screens/AdminHomeScreen.js`
- docs and regression
  - WI doc
  - roadmap update
  - WI-0253 e2e script

### Out of Scope

- ML model-based recommendation ranking
- server-side recommendation policy sync
- shared recommendation preset sync across users/devices

## Validation

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
