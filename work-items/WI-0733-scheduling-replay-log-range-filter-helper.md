# WI-0733 Scheduling Replay Log Range Filter Helper

## Summary
- extracted replay log-range filtering into
  `filterScheduleAnomalyIncidentReplayLogsByRange` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to use the helper instead of inline
  `logs.filter(...)` range logic.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0733-scheduling-replay-log-range-filter-helper.test.ts`
- `npm.cmd run typecheck`
