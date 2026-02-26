# WI-0508: Scheduling Anomaly Queue Helper Extraction Line Budget Phase 3

## Summary
- Goal: continue reducing `src/features/scheduling/service.ts` by extracting anomaly incident queue filtering/SLA projection logic into a dedicated helper.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-queue-helpers.ts`
  - `scripts/tests/e2e-wi0508-scheduling-anomaly-queue-helper-extraction-line-budget-phase3.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-incident-queue-helpers.ts` with:
  - `filterScheduleAnomalyIncidentQueue`
  - `buildScheduleAnomalyIncidentSlaQueue`
- Rewired `service.ts` to consume helper functions in:
  - `listScheduleAnomalyIncidents`
  - `listScheduleAnomalyIncidentSla`
- Reduced `scheduling/service.ts` line count:
  - 4551 -> 4505

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0503-scheduling-anomaly-report-helper-extraction-line-budget-phase1.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0506-scheduling-anomaly-cockpit-projection-helper-extraction-line-budget-phase2.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0508-scheduling-anomaly-queue-helper-extraction-line-budget-phase3.test.ts`
- [x] `npm.cmd run typecheck`
