# WI-0510: Scheduling Anomaly Archive Helper Extraction Line Budget Phase 5

## Summary
- Goal: continue reducing `src/features/scheduling/service.ts` by extracting anomaly incident archive candidate selection and archive action loop into dedicated helpers.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-archive-helpers.ts`
  - `scripts/tests/e2e-wi0510-scheduling-anomaly-archive-helper-extraction-line-budget-phase5.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-incident-archive-helpers.ts` with:
  - `buildScheduleAnomalyIncidentArchiveCandidates`
  - `executeScheduleAnomalyIncidentArchiveActions`
- Rewired `archiveScheduleAnomalyIncidents` in `service.ts` to delegate:
  - archive candidate filtering/sorting/selection
  - dry-run/archive/failure loop aggregation
- Reduced `scheduling/service.ts` line count:
  - 4411 -> 4349

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0508-scheduling-anomaly-queue-helper-extraction-line-budget-phase3.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0509-scheduling-anomaly-auto-action-helper-extraction-line-budget-phase4.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0510-scheduling-anomaly-archive-helper-extraction-line-budget-phase5.test.ts`
- [x] `npm.cmd run typecheck`
