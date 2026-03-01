# WI-0744 Scheduling Replay Generated Audit Payload Input Helper

## Summary
- extracted generated replay audit payload input assembly into
  `buildScheduleAnomalyIncidentReplayGeneratedAuditPayloadInputFromMetaAndSummary`
  in `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to pass helper-built payload input into
  `buildScheduleAnomalyIncidentReplayGeneratedAuditPayload`.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0744-scheduling-replay-generated-audit-payload-input-helper.test.ts`
- `npm.cmd run typecheck`
