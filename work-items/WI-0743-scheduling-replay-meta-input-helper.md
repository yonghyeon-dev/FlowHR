# WI-0743 Scheduling Replay Meta Input Helper

## Summary
- extracted replay meta assembly into
  `resolveScheduleAnomalyIncidentReplayMetaFromServiceInput` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to build replay meta via helper instead
  of inline object composition.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0743-scheduling-replay-meta-input-helper.test.ts`
- `npm.cmd run typecheck`
