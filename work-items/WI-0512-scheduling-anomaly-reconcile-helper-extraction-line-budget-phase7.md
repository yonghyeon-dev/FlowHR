# WI-0512: Scheduling Anomaly Reconcile Helper Extraction Line Budget Phase 7

## Summary
- Goal: continue reducing `src/features/scheduling/service.ts` by extracting anomaly incident reconciliation comparison/count/item-selection logic into a dedicated helper.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-reconcile-helpers.ts`
  - `scripts/tests/e2e-wi0512-scheduling-anomaly-reconcile-helper-extraction-line-budget-phase7.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-incident-reconcile-helpers.ts` with:
  - `buildScheduleAnomalyIncidentReconcileSnapshot`
  - `selectScheduleAnomalyIncidentReconcileItems`
- Rewired `reconcileScheduleAnomalyIncidentStore` in `service.ts` to delegate:
  - store/audit row 비교 스냅샷 생성
  - includeMatching/topN 기준 결과 선택
- Reduced `scheduling/service.ts` line count:
  - 4306 -> 4236

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0510-scheduling-anomaly-archive-helper-extraction-line-budget-phase5.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0511-scheduling-anomaly-replay-helper-extraction-line-budget-phase6.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0512-scheduling-anomaly-reconcile-helper-extraction-line-budget-phase7.test.ts`
- [x] `npm.cmd run typecheck`
