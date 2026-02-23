# WI-0258: Mobile Preset Layering Cleanup Baseline

## Background

WI-0246~0248 and WI-0253~0255 added chained preset/template layers on top of
core mobile flows. This repeated the known layering pattern and reduced roadmap
efficiency. WI-0258 rolls back those layered surfaces and keeps only the core
user journeys.

## Scope

### In Scope

- codex session guard reinforcement
  - `CLAUDE.md`
  - mandatory reference to `docs/codex-guide.md`
- mobile notification history cleanup (remove layered preset chain)
  - `apps/mobile/src/screens/NotificationHistoryScreen.js`
  - `apps/mobile/src/lib/notificationHistory.js`
  - `apps/mobile/src/lib/notificationStore.js`
  - remove quick preset / pin-recent / import-export transfer paths
  - keep search/filter/archive/bulk core flow
- mobile employee follow-up cleanup (remove layered follow-up chain)
  - `apps/mobile/src/screens/EmployeeRequestFollowUpScreen.js`
  - `apps/mobile/src/lib/employeeRequest.js`
  - `apps/mobile/src/lib/employeeRequestStore.js`
  - remove template recommendation / action bundle preset / import-export transfer
  - keep follow-up inbox/filter/action core flow
- cleanup dead mobile components
  - remove `NotificationPresetTransferCard`
  - remove `EmployeeRequestFollowUpPresetTransferCard`
- docs and work-item deprecation marking
  - `apps/mobile/README.md`
  - `ROADMAP.md`
  - add DEPRECATED header to WI-0246~0248 and WI-0253~0255
- WI-0258 regression test
  - `scripts/tests/e2e-wi0258-mobile-preset-layering-cleanup-baseline.test.ts`

### Out of Scope

- mobile analytics preset chain cleanup (`WI-0257`) in this WI
- backend payroll engine changes
- mobile navigation IA changes

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0258-mobile-preset-layering-cleanup-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0252-mobile-employee-request-notification-follow-up-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0251-mobile-employee-request-history-status-tracking-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0245-mobile-notification-history-bulk-actions-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0244-mobile-notification-history-search-archive-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
