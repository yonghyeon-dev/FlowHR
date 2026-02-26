# WI-0514: Scheduling Anomaly Incident List Helper Extraction Line Budget Phase 9

## Summary
- Goal: simplify `listScheduleAnomalyIncidents` orchestration by extracting queue filter/slice/clone assembly into a dedicated helper while preserving line-budget ceiling.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-list-helpers.ts`
  - `scripts/tests/e2e-wi0514-scheduling-anomaly-incident-list-helper-extraction-line-budget-phase9.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-incident-list-helpers.ts` with:
  - `buildScheduleAnomalyIncidentListResult`
- Rewired `listScheduleAnomalyIncidents` in `service.ts` to delegate:
  - state/assignee filter
  - topN selection and clone projection
- Scheduling service line-budget ceiling remains stable:
  - `service.ts` stays within <= 4200 guard (current 4172)

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0513-scheduling-anomaly-escalation-helper-extraction-line-budget-phase8.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0514-scheduling-anomaly-incident-list-helper-extraction-line-budget-phase9.test.ts`
- [x] `npm.cmd run typecheck`
