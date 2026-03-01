# WI-0720 Scheduling Escalation Candidate Filter Helper

## Summary
- extracted escalation execution preparation into
  `resolveScheduleAnomalyIncidentEscalationExecutionPreparation` in
  `src/features/scheduling/anomaly-incident-escalation-helpers.ts`.
- rewired `triggerScheduleAnomalyIncidentEscalation` in
  `src/features/scheduling/service.ts` to consume prepared candidates,
  candidateCount, cooldown window start millis, and latest request map from one helper.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0720-scheduling-escalation-candidate-filter-helper.test.ts`
- `npm.cmd run typecheck`
