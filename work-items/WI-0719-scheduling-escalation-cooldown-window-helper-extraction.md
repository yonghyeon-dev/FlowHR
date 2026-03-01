# WI-0719 Scheduling Escalation Cooldown Window Helper Extraction

## Summary
- extracted cooldown window-start calculation into
  `resolveScheduleAnomalyIncidentEscalationCooldownWindowStartMillis` in
  `src/features/scheduling/anomaly-incident-escalation-helpers.ts`.
- rewired `triggerScheduleAnomalyIncidentEscalation` in
  `src/features/scheduling/service.ts` to use the helper.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0719-scheduling-escalation-cooldown-window-helper-extraction.test.ts`
- `npm.cmd run typecheck`
