# WI-0455: Admin People Page-View Panel Decomposition (Line Budget 300)

## Summary
- Goal: Split `src/app/admin/people/page-view.tsx` into focused panel components and keep the orchestration view <= 300 lines.
- Scope:
  - Move directory filters, org chart, employee compare, history, and request logs to dedicated files.
  - Preserve existing section anchors and semantics used by tests/navigation.

## Delivery
- Added panel components:
  - `src/app/admin/people/page-view-directory-filters-panel.tsx`
  - `src/app/admin/people/page-view-org-chart-panel.tsx`
  - `src/app/admin/people/page-view-compare-panel.tsx`
  - `src/app/admin/people/page-view-history-panel.tsx`
  - `src/app/admin/people/page-view-logs-panel.tsx`
- Updated `src/app/admin/people/page-view.tsx`
  - Converted to orchestration wrapper with preserved anchors (`directory-filters`, `org-chart`, `employee-compare`, `employee-history`).
  - Line count reduced to 290.
- Added `scripts/tests/e2e-wi0455-admin-people-page-view-panel-decomposition-line-budget-300.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0455-admin-people-page-view-panel-decomposition-line-budget-300.test.ts`
