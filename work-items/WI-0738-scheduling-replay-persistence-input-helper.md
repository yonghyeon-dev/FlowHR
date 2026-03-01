# WI-0738 Scheduling Replay Persistence Input Helper

## Summary
- extracted replay persistence input assembly into
  `buildScheduleAnomalyIncidentReplayPersistenceInput` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to persist using helper-provided
  `upsertInput` and `auditEntry`.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0738-scheduling-replay-persistence-input-helper.test.ts`
- `npm.cmd run typecheck`
