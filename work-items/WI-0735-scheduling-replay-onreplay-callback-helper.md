# WI-0735 Scheduling Replay onReplay Callback Helper

## Summary
- extracted replay upsert merge logic into
  `mergeScheduleAnomalyIncidentReplayLastEscalationRequestedAt` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to call the helper when preparing
  `upsertIncident` input inside `onReplay` callback.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0735-scheduling-replay-onreplay-callback-helper.test.ts`
- `npm.cmd run typecheck`
