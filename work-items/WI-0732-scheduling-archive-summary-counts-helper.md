# WI-0732 Scheduling Archive Summary Counts Helper

## Summary
- extracted archive summary-count builder into
  `buildScheduleAnomalyIncidentArchiveSummaryCounts` in
  `src/features/scheduling/anomaly-incident-archive-helpers.ts`.
- rewired `archiveScheduleAnomalyIncidents` in
  `src/features/scheduling/service.ts` to reuse `archiveSummary` for generated
  audit payload and archive result construction.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0732-scheduling-archive-summary-counts-helper.test.ts`
- `npm.cmd run typecheck`
