# WI-0430: Employee Request/Checklist Derived Hook Extraction

## Summary
- Goal: reduce `src/app/employee/page.tsx` monolith size and isolate request/checklist derived logic for maintainability.
- Scope:
  - extract request feedback/search/timeline/failure-cause/checklist derived memo blocks into:
    - `src/app/employee/page-request-checklist-derived-state.ts`
  - rewire `src/app/employee/page.tsx` to consume a single derived-state hook.

## Delivery
- Added hook:
  - `useEmployeeRequestChecklistDerivedState`
- Moved the following derived groups out of `page.tsx`:
  - request feedback rows/filter
  - request search rows/filter
  - mobile timeline rows/filter
  - failure-cause extraction + latest failure summary
  - correction/attendance/leave/resubmit pre-submit checks
  - integrated submit checklist cards
- Rewired page input bundles for the new hook:
  - request feedback defaults
  - request search defaults
  - request failure defaults
  - validation/copy bundles

## Result
- `src/app/employee/page.tsx` line count:
  - before: `949`
  - after: `764`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0417-employee-runtime-session-bootstrap-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0428-employee-request-flow-helper-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0430-employee-request-checklist-derived-hook-extraction.test.ts`
