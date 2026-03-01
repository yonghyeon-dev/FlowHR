# WI-0728 Scheduling Archive Side-Effect Callback Helper

## Summary
- extracted archive on-archived audit entry construction into
  `buildScheduleAnomalyIncidentArchivedAuditEntry` in
  `src/features/scheduling/anomaly-incident-archive-helpers.ts`.
- rewired `archiveScheduleAnomalyIncidents` in
  `src/features/scheduling/service.ts` to call the helper in the `onArchived`
  side-effect callback.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0728-scheduling-archive-side-effect-callback-helper.test.ts`
- `npm.cmd run typecheck`
