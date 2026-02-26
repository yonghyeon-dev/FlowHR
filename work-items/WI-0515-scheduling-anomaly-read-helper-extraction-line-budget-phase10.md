# WI-0515: Scheduling Anomaly Read Helper Extraction Line Budget Phase 10

## Summary
- Goal: simplify `getScheduleAnomalyIncident` by extracting incident id normalization + read-model lookup + tenant boundary enforcement into a dedicated helper.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-incident-read-helpers.ts`
  - `scripts/tests/e2e-wi0515-scheduling-anomaly-read-helper-extraction-line-budget-phase10.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-incident-read-helpers.ts` with:
  - `resolveScheduleAnomalyIncidentForActor`
- Rewired `getScheduleAnomalyIncident` in `service.ts` to delegate read/tenant validation.
- Reduced `scheduling/service.ts` line count:
  - 4172 -> 4165

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0514-scheduling-anomaly-incident-list-helper-extraction-line-budget-phase9.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0515-scheduling-anomaly-read-helper-extraction-line-budget-phase10.test.ts`
- [x] `npm.cmd run typecheck`
