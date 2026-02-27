# WI-0575: Scheduling Anomaly Cockpit Summary/Result Helper Extraction

## Summary
- Goal: reduce orchestration density in `listScheduleAttendanceAnomalyCockpit` by extracting cockpit generated audit payload and cockpit report composition.
- Scope:
  - `src/features/scheduling/anomaly-cockpit-report-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0575-scheduling-anomaly-cockpit-summary-result-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAttendanceAnomalyCockpitAuditPayload` helper for cockpit generated audit payload.
- Added `buildScheduleAttendanceAnomalyCockpitReport` helper for cockpit API response payload composition.
- Rewired `listScheduleAttendanceAnomalyCockpit` to delegate payload/result assembly to helper functions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0575-scheduling-anomaly-cockpit-summary-result-helper-extraction.test.ts`

