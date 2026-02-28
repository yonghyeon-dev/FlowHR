# WI-0678 Scheduling Rotation Balance Summary Helper Extraction

## Summary
- extracted rotation-balance weekday aggregation/summary/recommendation logic from
  `src/features/scheduling/service.ts` into:
  - `src/features/scheduling/rotation-balance-report-helpers.ts`
- rewired `listWorkScheduleRotationBalance` to use the new summary helper.
- preserved report payload and recommendation behavior.
- added WI-0678 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0678-scheduling-rotation-balance-summary-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0057-scheduling-rotation-balance-report.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0676-scheduling-list-query-helper-extraction.test.ts`
- `npm.cmd run typecheck`
