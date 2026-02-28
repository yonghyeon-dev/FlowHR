# WI-0653 Scheduling Rotation Fairness Core Helper Extraction

## Summary
- extracted rotation fairness core helper functions from `src/features/scheduling/service.ts` into:
  - `src/features/scheduling/rotation-fairness-core-helpers.ts`
- moved pure core blocks to helper:
  - schedule/window planned-minute calculators
  - rotation balance grade resolver
  - template/employee id normalization
  - fairness global/advanced constraint normalization
  - advanced fairness score evaluation
  - weekday-set key helper
- updated `service.ts` to import and use the helper exports while keeping existing behavior and API surface.
- reduced `src/features/scheduling/service.ts` line count from 3303 to 2950.
- added regression test to lock helper extraction and line budgets.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0653-scheduling-rotation-fairness-core-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0058-scheduling-rotation-optimization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0059-scheduling-rotation-fairness.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0063-scheduling-global-fairness-constraints.test.ts`
- `npm.cmd run typecheck`
