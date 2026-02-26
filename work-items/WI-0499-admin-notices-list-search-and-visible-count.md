# WI-0499: Admin Notices List Search and Visible Count

## Summary
- Goal: improve admin notice operation speed in `/admin/notices` by adding list search and visible-count feedback.
- Scope:
  - `src/components/notices/AdminNoticeWorkspace.tsx`
  - `src/components/notices/AdminNoticeWorkspaceView.tsx`
  - `src/components/notices/copy.ts`
  - `scripts/tests/e2e-wi0499-admin-notices-list-search-and-visible-count.test.ts`
  - `ROADMAP.md`

## Delivery
- Added local notice-list search by title/body in admin notice workspace.
- Added list UX controls:
  - search input + clear action
  - visible/total count summary
  - filtered-empty guidance when no row matches query
- Kept workspace line-budget guardrail:
  - `AdminNoticeWorkspace.tsx` remains <= 300 lines.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0418-notices-read-receipt-core-journey.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0421-notices-admin-read-coverage-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0473-admin-notice-workspace-view-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0476-admin-non-payroll-workspace-line-budget-guard.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0499-admin-notices-list-search-and-visible-count.test.ts`
- [x] `npm.cmd run typecheck`
