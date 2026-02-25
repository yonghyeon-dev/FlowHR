# WI-0433: Employee Mutation Runtime Extraction And Line Budget 500

## Summary
- Goal: reduce `src/app/employee/page.tsx` to the 500-line budget while preserving mutation and interaction behavior.
- Scope:
  - extract API-call + mutation-action wiring from page component
  - keep `page-mutation-actions.ts` as the core action orchestrator
  - update regression tests to validate the new runtime wrapper location.

## Delivery
- Added:
  - `src/app/employee/page-mutation-runtime.ts`
    - `buildEmployeeMutationRuntime` now owns:
      - `performEmployeeApiCall` invocation
      - pending/log lifecycle
      - `buildEmployeeMutationActions` wiring
      - `clearLogs` helper
- Rewired:
  - `src/app/employee/page.tsx`
    - removed in-page `callApi` function
    - removed direct `buildEmployeeMutationActions` assembly
    - now consumes `{ mutationActions, clearLogs }` from runtime wrapper
    - compacted interaction setter wiring while keeping behavior unchanged.
- Updated regressions:
  - `scripts/tests/e2e-wi0375-employee-api-helper-extraction.test.ts`
  - `scripts/tests/e2e-wi0389-employee-mutation-action-orchestrator-extraction.test.ts`
  - `scripts/tests/e2e-wi0433-employee-mutation-runtime-extraction-and-line-budget-500.test.ts` (new)

## Result
- `src/app/employee/page.tsx` line count:
  - before: `568`
  - after: `499`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0375-employee-api-helper-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0389-employee-mutation-action-orchestrator-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0431-employee-dashboard-derived-hook-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0433-employee-mutation-runtime-extraction-and-line-budget-500.test.ts`
