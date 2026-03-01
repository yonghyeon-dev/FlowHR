# WI-0752 Scheduling Auto-Action Assignment Callback Helper

## Summary
- extracted auto-action assignment callback builder into
  `buildScheduleAnomalyIncidentAutoActionAssignIncidentCallback` in
  `src/features/scheduling/anomaly-incident-auto-action-helpers.ts`.
- rewired `executeScheduleAnomalyIncidentAutoAction` in
  `src/features/scheduling/service.ts` to inject helper-built
  `assignAutoActionIncident` callback into assignment execution.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0752-scheduling-auto-action-assignment-callback-helper.test.ts`
- `npm.cmd run typecheck`
