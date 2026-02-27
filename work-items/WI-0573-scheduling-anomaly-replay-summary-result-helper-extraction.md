# WI-0573: Scheduling Anomaly Replay Summary/Result Helper Extraction

## Summary
- Goal: reduce orchestration density in `replayScheduleAnomalyIncidentStore` by extracting replay audit payload and result composition to replay helpers.
- Scope:
  - `src/features/scheduling/anomaly-incident-replay-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0573-scheduling-anomaly-replay-summary-result-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAnomalyIncidentReplayAuditPayload` for replay action audit payload assembly (including history mapping).
- Added `buildScheduleAnomalyIncidentReplayGeneratedAuditPayload` for replay generated summary payload assembly.
- Added `buildScheduleAnomalyIncidentReplayResult` for replay API response payload composition.
- Rewired `replayScheduleAnomalyIncidentStore` to delegate payload/result assembly to replay helper functions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0573-scheduling-anomaly-replay-summary-result-helper-extraction.test.ts`

