# WI-0717 Scheduling Anomaly Escalation Candidate Helper

## Summary
- added `selectScheduleAnomalyIncidentEscalationCandidates` in
  `src/features/scheduling/anomaly-incident-escalation-helpers.ts`.
- rewired `triggerScheduleAnomalyIncidentEscalation` in
  `src/features/scheduling/service.ts` to use the shared helper for
  BREACHED/WARNING candidate selection.
- preserved escalation behavior while reducing inline filtering logic in service.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0717-scheduling-anomaly-escalation-candidate-helper.test.ts`
- `npm.cmd run typecheck`
