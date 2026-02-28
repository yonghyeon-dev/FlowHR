# WI-0686 Scheduling Rotation-Balance Result Helper Extraction

## Summary
- extracted rotation-balance report return-model composition from
  `src/features/scheduling/service.ts` into:
  - `buildRotationBalanceReportResult` in
    `src/features/scheduling/rotation-balance-report-helpers.ts`
- rewired `listWorkScheduleRotationBalance` to return helper-generated result.
- preserved response shape and balance-report behavior.
- added WI-0686 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0686-scheduling-rotation-balance-result-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0057-scheduling-rotation-balance-report.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0683-scheduling-rotation-balance-audit-payload-helper-extraction.test.ts`
- `npm.cmd run typecheck`
