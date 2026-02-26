# WI-0564: Scheduling Rotation Optimization Evaluation Helper Extraction and Line-Budget Recovery

## Summary
- Goal: keep `scheduling/service.ts` focused on orchestration by extracting rotation offset evaluation/ranking logic.
- Scope:
  - `src/features/scheduling/rotation-optimization-evaluation-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0564-scheduling-rotation-optimization-evaluation-helper-extraction-and-line-budget-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted rotation offset evaluation and ranking logic to `rotation-optimization-evaluation-helpers.ts`.
- Rewired `evaluateBestRotationForEmployee` to delegate calculations to extracted helper functions.
- Reduced `scheduling/service.ts` line footprint while preserving existing rotation behavior.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0564-scheduling-rotation-optimization-evaluation-helper-extraction-and-line-budget-recovery.test.ts`
