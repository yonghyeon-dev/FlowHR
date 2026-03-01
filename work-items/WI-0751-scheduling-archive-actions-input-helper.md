# WI-0751 Scheduling Archive Actions Input Helper

## Summary
- extracted archive action execution input assembly into
  `buildScheduleAnomalyIncidentArchiveActionsInput` in
  `src/features/scheduling/anomaly-incident-archive-helpers.ts`.
- rewired `archiveScheduleAnomalyIncidents` in
  `src/features/scheduling/service.ts` to pass helper-built
  `archiveActionsInput` into `executeScheduleAnomalyIncidentArchiveActions`.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0751-scheduling-archive-actions-input-helper.test.ts`
- `npm.cmd run typecheck`
