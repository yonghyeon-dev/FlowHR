# WI-0567: Scheduling Anomaly Auto-Action Summary/Result Helper Extraction

## Summary
- Goal: reduce orchestration density in `scheduling/service.ts` by extracting auto-action summary/result payload composition.
- Scope:
  - `src/features/scheduling/anomaly-incident-auto-action-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0567-scheduling-anomaly-auto-action-summary-result-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAnomalyIncidentAutoActionSummaryPayload` helper for auto-action execution audit/event payload composition.
- Added `buildScheduleAnomalyIncidentAutoActionResult` helper for service response payload composition.
- Rewired `executeScheduleAnomalyIncidentAutoAction` in `service.ts` to delegate payload assembly to helper functions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0567-scheduling-anomaly-auto-action-summary-result-helper-extraction.test.ts`

