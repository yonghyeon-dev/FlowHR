# WI-0568: Scheduling Anomaly Escalation Summary/Result Helper Extraction

## Summary
- Goal: reduce orchestration density in `scheduling/service.ts` by extracting escalation summary/result payload composition.
- Scope:
  - `src/features/scheduling/anomaly-incident-escalation-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0568-scheduling-anomaly-escalation-summary-result-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAnomalyIncidentEscalationSummaryPayload` helper for escalation generation audit payload composition.
- Added `buildScheduleAnomalyIncidentEscalationResult` helper for escalation API response payload composition.
- Rewired `triggerScheduleAnomalyIncidentEscalation` in `service.ts` to delegate payload assembly to helper functions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0568-scheduling-anomaly-escalation-summary-result-helper-extraction.test.ts`

