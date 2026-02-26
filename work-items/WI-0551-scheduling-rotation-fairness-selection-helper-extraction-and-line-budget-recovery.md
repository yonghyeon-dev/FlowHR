# WI-0551: Scheduling Rotation Fairness Selection Helper Extraction and Line-Budget Recovery

## Summary
- Goal: continue scheduling service modularization by extracting rotation-fairness selection/summary helpers.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/rotation-fairness-selection-helpers.ts`
  - `scripts/tests/e2e-wi0551-scheduling-rotation-fairness-selection-helper-extraction-and-line-budget-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted rotation fairness recommendation selection and advanced summary aggregation helpers.
- Rewired scheduling service to import extracted helpers.
- Reduced `scheduling/service.ts` line count while preserving behavior.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0551-scheduling-rotation-fairness-selection-helper-extraction-and-line-budget-recovery.test.ts`
