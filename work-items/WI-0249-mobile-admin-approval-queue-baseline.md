# WI-0249: Mobile Admin Approval Queue Baseline

## Background

After notification workflows (WI-0241~0248), the admin mobile shell still lacked
a direct approval execution surface. This WI adds a mobile-first queue baseline
for stalled approval review and quick decision actions.

## Scope

### In Scope

- admin approval queue domain helper baseline
  - `apps/mobile/src/lib/approvalQueue.js`
  - queue seed data
  - search/status/priority filters
  - stalled/priority/newest sort
  - queue snapshot stats
  - quick approve/reject decision helper
- admin approval queue local persistence baseline
  - `apps/mobile/src/lib/approvalQueueStore.js`
  - secure-store load/save/reset API
  - normalization guard for queue items
- admin approval queue screen baseline
  - `apps/mobile/src/screens/ApprovalQueueScreen.js`
  - filter/search/sort controls
  - pending queue list + quick approve/reject buttons
  - refresh/reset actions + tenant/actor snapshot
- admin navigation wiring
  - `apps/mobile/src/navigation/RootNavigator.js`
  - `apps/mobile/src/screens/AdminHomeScreen.js`
  - Admin home "승인 대기 보기" direct route to queue screen
- shell copy bump for next placeholder (`WI-0250~`)
- docs and regression
  - WI doc
  - roadmap update
  - WI-0249 e2e script

### Out of Scope

- backend approval execution API integration
- push/escalation automation from mobile queue actions
- cross-device approval queue sync

## Validation

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
