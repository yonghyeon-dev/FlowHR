# WI-0506: Scheduling Anomaly Cockpit Projection Helper Extraction Line Budget Phase 2

## Summary
- Goal: continue reducing `scheduling/service.ts` complexity by extracting anomaly cockpit projection assembly logic into a dedicated helper module.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-cockpit-report-helpers.ts`
  - `scripts/tests/e2e-wi0506-scheduling-anomaly-cockpit-projection-helper-extraction-line-budget-phase2.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-cockpit-report-helpers.ts` with:
  - `buildScheduleAttendanceAnomalyCockpitProjection`
  - centralized cockpit employee/queue/severity projection build
- Rewired `listScheduleAttendanceAnomalyCockpit` in `service.ts` to use the helper.
- Reduced `scheduling/service.ts` line count:
  - 4624 -> 4551

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0466-core-line-budget-guard-phase3-scheduling-leave-runtime.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0503-scheduling-anomaly-report-helper-extraction-line-budget-phase1.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0506-scheduling-anomaly-cockpit-projection-helper-extraction-line-budget-phase2.test.ts`
- [x] `npm.cmd run typecheck`
