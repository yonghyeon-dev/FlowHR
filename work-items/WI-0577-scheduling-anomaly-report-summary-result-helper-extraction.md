# WI-0577: Scheduling Anomaly Report Summary/Result Helper Extraction

## Summary
- Goal: reduce orchestration density in `listScheduleAttendanceAnomalies` by extracting anomaly report generated audit payload and report result composition.
- Scope:
  - `src/features/scheduling/anomaly-report-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0577-scheduling-anomaly-report-summary-result-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAttendanceAnomalyReportAuditPayload` helper for anomaly report generated audit payload.
- Added `buildScheduleAttendanceAnomalyReport` helper for anomaly report API response payload composition.
- Rewired `listScheduleAttendanceAnomalies` to delegate payload/result assembly to helper functions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0577-scheduling-anomaly-report-summary-result-helper-extraction.test.ts`

