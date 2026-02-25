# WI-0435: Employee Benefits Request Search Filter

## Summary
- Goal: improve benefits self-service history navigation by adding local search on request history.
- Scope:
  - search by benefit name and request reason
  - keep existing status filter behavior
  - expose visible-count and search-empty feedback.

## Delivery
- Updated `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
  - added `requestSearchQuery` state
  - added `filteredRequests` memo from `requests` + `catalogById`
  - added search input and clear-search action button
  - added visible request count in summary line
  - split empty-state handling:
    - no request history (`emptyRequests`)
    - no search match (`filteredEmptyRequests`)
- Updated `src/components/benefits/copy.ts`
  - added ko/en copy keys:
    - `requestSearchLabel`, `requestSearchPlaceholder`
    - `clearSearchAction`
    - `filteredRequestSummaryLabel`
    - `filteredEmptyRequests`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0424-benefits-request-cancel-self-service.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0435-employee-benefits-request-search-filter.test.ts`
