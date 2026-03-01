# WI-0745 Scheduling Replay Result Summary Helper

## Summary
- extracted replay result summary assembly into
  `buildScheduleAnomalyIncidentReplayResultSummary` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to build result summary through helper.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0745-scheduling-replay-result-summary-helper.test.ts`
- `npm.cmd run typecheck`
