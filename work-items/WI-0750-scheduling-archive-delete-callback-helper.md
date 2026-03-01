# WI-0750 Scheduling Archive Delete Callback Helper

## Summary
- extracted archive delete callback builder into
  `buildScheduleAnomalyIncidentArchiveDeleteIncidentCallback` in
  `src/features/scheduling/anomaly-incident-archive-helpers.ts`.
- rewired `archiveScheduleAnomalyIncidents` in
  `src/features/scheduling/service.ts` to use helper-built `deleteArchivedIncident`
  callback in archive action execution.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0750-scheduling-archive-delete-callback-helper.test.ts`
- `npm.cmd run typecheck`
