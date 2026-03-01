# WI-0734 Scheduling Archive Meta Helper

## Summary
- extracted archive meta normalization into
  `resolveScheduleAnomalyIncidentArchiveMeta` in
  `src/features/scheduling/anomaly-incident-archive-helpers.ts`.
- rewired `archiveScheduleAnomalyIncidents` in
  `src/features/scheduling/service.ts` to reuse `archiveMeta` in generated
  audit payload and archive result builders.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0734-scheduling-archive-meta-helper.test.ts`
- `npm.cmd run typecheck`
