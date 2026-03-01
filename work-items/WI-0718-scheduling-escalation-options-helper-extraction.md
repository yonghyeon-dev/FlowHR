# WI-0718 Scheduling Escalation Options Helper Extraction

## Summary
- extracted escalation option normalization (`includeResolved`, `includeWarning`,
  `dryRun`, cooldown/channel normalization, `asOf`) into
  `resolveScheduleAnomalyIncidentEscalationOptions` in
  `src/features/scheduling/anomaly-incident-escalation-helpers.ts`.
- rewired `triggerScheduleAnomalyIncidentEscalation` in
  `src/features/scheduling/service.ts` to consume the shared helper output.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0718-scheduling-escalation-options-helper-extraction.test.ts`
- `npm.cmd run typecheck`
