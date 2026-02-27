# WI-0572: Scheduling Anomaly Archive Summary/Result Helper Extraction

## Summary
- Goal: reduce orchestration density in `archiveScheduleAnomalyIncidents` by extracting archive audit payload and result composition into archive helpers.
- Scope:
  - `src/features/scheduling/anomaly-incident-archive-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0572-scheduling-anomaly-archive-summary-result-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAnomalyIncidentArchiveAuditPayload` for archive action audit payload assembly.
- Added `buildScheduleAnomalyIncidentArchiveGeneratedAuditPayload` for archive generated summary audit payload assembly.
- Added `buildScheduleAnomalyIncidentArchiveResult` for archive API response payload composition.
- Rewired `archiveScheduleAnomalyIncidents` to delegate payload/result assembly to helper functions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0572-scheduling-anomaly-archive-summary-result-helper-extraction.test.ts`

