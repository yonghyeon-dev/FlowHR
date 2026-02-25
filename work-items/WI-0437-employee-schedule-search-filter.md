# WI-0437: Employee Schedule Search Filter

## Summary
- Goal: improve employee schedule list navigation with local search in self-service.
- Scope:
  - add search by schedule ID/notes
  - keep existing status/holiday/date filters unchanged
  - expose visible-count indicator.

## Delivery
- Updated `src/components/scheduling/EmployeeScheduleBoard.tsx`
  - added `searchQuery` state
  - extended row derivation filter with normalized search text matching:
    - `schedule.id`
    - `schedule.notes`
  - added `clearSearch` handler
  - passed search props to view component.
- Updated `src/components/scheduling/EmployeeScheduleBoardView.tsx`
  - added search input, clear-search button
  - added visible count indicator (`visible / total`)
  - extended props for search wiring.
- Updated `src/components/scheduling/copy.ts`
  - added ko/en copy keys:
    - `searchLabel`, `searchPlaceholder`
    - `clearSearchAction`
    - `visibleCountLabel`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0410-schedule-user-journey-enhancement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0437-employee-schedule-search-filter.test.ts`
