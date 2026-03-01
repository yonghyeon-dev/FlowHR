# WI-0727 Scheduling Archive Generated Audit Entry Helper

## Summary
- extracted archive-generated audit entry builder into
  `buildScheduleAnomalyIncidentArchiveGeneratedAuditEntry` in
  `src/features/scheduling/anomaly-incident-archive-helpers.ts`.
- rewired `archiveScheduleAnomalyIncidents` in
  `src/features/scheduling/service.ts` to append the generated audit entry via
  the helper.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0727-scheduling-archive-generated-audit-entry-helper.test.ts`
- `npm.cmd run typecheck`
