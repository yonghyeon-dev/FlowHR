# WI-0511: Scheduling Anomaly Replay Helper Extraction Line Budget Phase 6

## Summary
- Goal: continue reducing `src/features/scheduling/service.ts` by extracting anomaly incident replay target selection and replay execution loop into a dedicated helper.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-replay-helpers.ts`
  - `scripts/tests/e2e-wi0511-scheduling-anomaly-replay-helper-extraction-line-budget-phase6.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-incident-replay-helpers.ts` with:
  - `selectScheduleAnomalyIncidentReplayTargets`
  - `executeScheduleAnomalyIncidentReplayActions`
- Rewired `replayScheduleAnomalyIncidentStore` in `service.ts` to delegate:
  - replay 대상 선택(topN/incidentIds)
  - dry-run/replay/not-found/failure 루프 집계
- Reduced `scheduling/service.ts` line count:
  - 4349 -> 4306

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0509-scheduling-anomaly-auto-action-helper-extraction-line-budget-phase4.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0510-scheduling-anomaly-archive-helper-extraction-line-budget-phase5.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0511-scheduling-anomaly-replay-helper-extraction-line-budget-phase6.test.ts`
- [x] `npm.cmd run typecheck`
