# WI-0513: Scheduling Anomaly Escalation Helper Extraction Line Budget Phase 8

## Summary
- Goal: continue reducing `src/features/scheduling/service.ts` by extracting anomaly incident escalation requested-at index build and escalation request execution loop into a dedicated helper.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-escalation-helpers.ts`
  - `scripts/tests/e2e-wi0513-scheduling-anomaly-escalation-helper-extraction-line-budget-phase8.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-incident-escalation-helpers.ts` with:
  - `buildLatestScheduleAnomalyEscalationRequestedAtMillisByIncident`
  - `executeScheduleAnomalyIncidentEscalationRequests`
- Rewired `triggerScheduleAnomalyIncidentEscalation` in `service.ts` to delegate:
  - cooldown index 구축
  - 요청/드라이런/쿨다운스킵/실패 실행 루프 집계
- Reduced `scheduling/service.ts` line count:
  - 4236 -> 4172

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0511-scheduling-anomaly-replay-helper-extraction-line-budget-phase6.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0512-scheduling-anomaly-reconcile-helper-extraction-line-budget-phase7.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0513-scheduling-anomaly-escalation-helper-extraction-line-budget-phase8.test.ts`
- [x] `npm.cmd run typecheck`
