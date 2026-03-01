# WI-0740 Scheduling Replay Existing State Helper

## Summary
- extracted replay callback orchestration into
  `buildScheduleAnomalyIncidentReplayOnReplayCallback` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to use helper-built `replayOnReplay`
  callback in replay action execution.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0740-scheduling-replay-existing-state-helper.test.ts`
- `npm.cmd run typecheck`
