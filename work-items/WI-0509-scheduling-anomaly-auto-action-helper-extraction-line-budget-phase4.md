# WI-0509: Scheduling Anomaly Auto Action Helper Extraction Line Budget Phase 4

## Summary
- Goal: continue reducing `src/features/scheduling/service.ts` by extracting anomaly incident auto-action assignment orchestration into a dedicated helper.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-auto-action-helpers.ts`
  - `scripts/tests/e2e-wi0509-scheduling-anomaly-auto-action-helper-extraction-line-budget-phase4.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-incident-auto-action-helpers.ts` with:
  - `executeScheduleAnomalyIncidentAutoActionAssignments`
  - escalation decision filtering / skip rules / dry-run / assignment result aggregation
- Rewired `executeScheduleAnomalyIncidentAutoAction` in `service.ts` to delegate assignment loop to helper.
- Reduced `scheduling/service.ts` line count:
  - 4505 -> 4411

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0506-scheduling-anomaly-cockpit-projection-helper-extraction-line-budget-phase2.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0508-scheduling-anomaly-queue-helper-extraction-line-budget-phase3.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0509-scheduling-anomaly-auto-action-helper-extraction-line-budget-phase4.test.ts`
- [x] `npm.cmd run typecheck`
