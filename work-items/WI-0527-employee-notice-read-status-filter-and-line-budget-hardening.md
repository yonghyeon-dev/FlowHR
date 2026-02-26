# WI-0527: Employee Notice Read-Status Filter and Line-Budget Hardening

## Summary
- Goal: improve employee notice triage with explicit read-status filtering while reducing `EmployeeNoticeBoard` bloat through helper/list decomposition.
- Scope:
  - `src/components/notices/EmployeeNoticeBoard.tsx`
  - `src/components/notices/EmployeeNoticeBoardList.tsx`
  - `src/components/notices/employee-notice-board-helpers.ts`
  - `src/components/notices/copy.ts`
  - `scripts/tests/e2e-wi0418-notices-read-receipt-core-journey.test.ts`
  - `scripts/tests/e2e-wi0434-employee-notices-search-and-unread-filter.test.ts`
  - `scripts/tests/e2e-wi0527-employee-notice-read-status-filter-and-line-budget.test.ts`
  - `ROADMAP.md`

## Delivery
- Added read-status filter in employee notices:
  - `all`
  - `unread`
  - `read`
- Kept existing `unread only` toggle and keyword search behavior; new filter composes with both.
- Extracted notice list rendering into `EmployeeNoticeBoardList` and moved parsing/filter/map helpers to
  `employee-notice-board-helpers.ts` so `EmployeeNoticeBoard` stays orchestration-focused.
- Expanded notice copy keys for read-status filter labels/options in both `ko`/`en`.
- Realigned legacy read-receipt/search regression tests with decomposed structure.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0418-notices-read-receipt-core-journey.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0434-employee-notices-search-and-unread-filter.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0527-employee-notice-read-status-filter-and-line-budget.test.ts`
- [x] `npm.cmd run typecheck`
