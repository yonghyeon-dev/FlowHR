# WI-0721 Scheduling Escalation Request Side-Effect Helper

## Summary
- extracted escalation request/failed audit-entry builders into
  `src/features/scheduling/anomaly-incident-escalation-helpers.ts`:
  - `buildScheduleAnomalyIncidentEscalationRequestedAuditEntry`
  - `buildScheduleAnomalyIncidentEscalationRequestFailedAuditEntry`
- rewired `triggerScheduleAnomalyIncidentEscalation` in
  `src/features/scheduling/service.ts` to call the new helpers so audit
  side-effect literals no longer live inline.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0721-scheduling-escalation-request-side-effect-helper.test.ts`
- `npm.cmd run typecheck`
