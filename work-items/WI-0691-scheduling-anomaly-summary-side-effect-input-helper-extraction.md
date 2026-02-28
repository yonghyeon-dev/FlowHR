# WI-0691 Scheduling Anomaly Summary Side-Effect Input Helper Extraction

## Summary
- extracted anomaly summary side-effect input composition into
  `buildScheduleAnomalySummarySideEffectInput` in
  `src/features/scheduling/anomaly-side-effect-helpers.ts`.
- rewired `listScheduleAttendanceAnomalies` in
  `src/features/scheduling/service.ts` to build and pass helper-generated
  summary side-effect input.
- preserved side-effect behavior.
- added WI-0691 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0691-scheduling-anomaly-summary-side-effect-input-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0685-scheduling-anomaly-summary-side-effect-helper-adoption.test.ts`
- `npm.cmd run typecheck`
