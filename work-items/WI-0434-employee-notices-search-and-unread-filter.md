# WI-0434: Employee Notices Search And Unread Filter

## Summary
- Goal: improve employee notice self-service discoverability with in-page filtering controls.
- Scope:
  - add keyword search (title/body)
  - add unread-only toggle
  - add visible-count summary and filter-empty feedback copy.

## Delivery
- Updated `src/components/notices/EmployeeNoticeBoard.tsx`
  - new local filters: `searchQuery`, `unreadOnly`
  - `filteredNotices` derived memo based on title/body match + unread condition
  - new controls in filter panel:
    - search input
    - unread-only checkbox
    - clear filters button
  - summary line now shows total published + visible + unread counts
  - list empty handling split:
    - no data (`listEmpty`)
    - no match for active filters (`filteredListEmpty`)
- Updated `src/components/notices/copy.ts`
  - added ko/en copy keys:
    - `searchLabel`, `searchPlaceholder`
    - `unreadOnlyLabel`
    - `clearFiltersAction`
    - `filteredSummaryLabel`
    - `filteredListEmpty`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0418-notices-read-receipt-core-journey.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0423-notices-mark-all-read-core-journey.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0434-employee-notices-search-and-unread-filter.test.ts`
