# WI-0753 Scheduling Escalation Summary Payload Input Helper

## Summary
- extracted escalation summary payload-input assembly into
  `buildScheduleAnomalyIncidentEscalationSummaryPayloadInputFromMetaAndExecution` in
  `src/features/scheduling/anomaly-incident-escalation-helpers.ts`.
- rewired `triggerScheduleAnomalyIncidentEscalation` in
  `src/features/scheduling/service.ts` to build payload input through helper before
  calling `buildScheduleAnomalyIncidentEscalationSummaryPayload`.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0753-scheduling-escalation-summary-payload-input-helper.test.ts`
- `npm.cmd run typecheck`
