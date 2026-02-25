# WI-0431: Employee Dashboard Derived Hook Extraction

## Summary
- Goal: continue decomposing `src/app/employee/page.tsx` monolith by extracting dashboard-level derived state.
- Scope:
  - add `src/app/employee/page-dashboard-derived-state.ts`
  - move attendance/leave/resubmit/integrated-summary derived memo/effect blocks out of page component
  - rewire `src/app/employee/page.tsx` to consume one derived-state hook.

## Delivery
- Added hook:
  - `useEmployeeDashboardDerivedState`
- Moved the following derived groups out of `page.tsx`:
  - latest payload and API log stats
  - leave balance summary, usage ring/card/projection labels
  - leave calendar month/cells/rows derivation
  - attendance/leave status summaries and request flow aggregation
  - resubmit candidate derivation + selected-candidate synchronization effect
  - integrated summary cards
  - correction delta label calculation
- Rewired page input bundles for the new hook:
  - locale defaults and summary-card copy
  - attendance/leave summary copy bundles
  - shared date/label formatter callbacks.

## Result
- `src/app/employee/page.tsx` line count:
  - before: `764`
  - after: `568`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0428-employee-request-flow-helper-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0430-employee-request-checklist-derived-hook-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0431-employee-dashboard-derived-hook-extraction.test.ts`
