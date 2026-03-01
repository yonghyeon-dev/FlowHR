# WI-0739 Scheduling Archive Action Callback Helper

## Summary
- extracted archive action audit callback composition into
  `buildScheduleAnomalyIncidentArchivedAuditAppender` in
  `src/features/scheduling/anomaly-incident-archive-helpers.ts`.
- rewired `archiveScheduleAnomalyIncidents` in
  `src/features/scheduling/service.ts` to pass the helper-built
  `appendArchivedAudit` callback into archive action execution.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0739-scheduling-archive-action-callback-helper.test.ts`
- `npm.cmd run typecheck`
