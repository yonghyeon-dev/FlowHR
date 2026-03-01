# WI-0730 Scheduling Replay Generated Audit Input Helper

## Summary
- extracted replay metadata normalization into
  `resolveScheduleAnomalyIncidentReplayMeta` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to reuse `replayMeta` for both generated
  audit payload and replay result construction.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0730-scheduling-replay-generated-audit-input-helper.test.ts`
- `npm.cmd run typecheck`
