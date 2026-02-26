# WI-0503: Scheduling Anomaly Report Helper Extraction Line Budget Phase 1

## Summary
- Goal: reduce `scheduling/service.ts` growth risk by extracting schedule-attendance anomaly report helpers into a dedicated module while preserving behavior.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-report-helpers.ts`
  - `scripts/tests/e2e-wi0503-scheduling-anomaly-report-helper-extraction-line-budget-phase1.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `anomaly-report-helpers.ts` with:
  - anomaly report/cockpit shared types
  - schedule-attendance anomaly set builder
  - anomaly cockpit recommended-action resolver
- Rewired `scheduling/service.ts` to import helper functions/types from the new module.
- Re-exported moved anomaly report types from `service.ts` to keep import compatibility.
- Reduced `scheduling/service.ts` size:
  - 4763 -> 4624 lines

## Validation
- [ ] `npm.cmd exec tsx scripts/tests/e2e-wi0466-core-line-budget-guard-phase3-scheduling-leave-runtime.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0503-scheduling-anomaly-report-helper-extraction-line-budget-phase1.test.ts`
- [x] `npm.cmd run typecheck`
