# WI-0722 Scheduling Escalation Summary Audit Entry Helper

## Summary
- extracted escalation summary audit-entry construction into
  `buildScheduleAnomalyIncidentEscalationGeneratedAuditEntry` in
  `src/features/scheduling/anomaly-incident-escalation-helpers.ts`.
- rewired `triggerScheduleAnomalyIncidentEscalation` in
  `src/features/scheduling/service.ts` to append summary audit using the helper,
  removing inline audit-entry literals.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0722-scheduling-escalation-summary-audit-entry-helper.test.ts`
- `npm.cmd run typecheck`
