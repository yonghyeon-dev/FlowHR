# WI-0656 Scheduling Rotation Assignment Core Helper Extraction

## Summary
- extracted rotation assignment core helpers from `src/features/scheduling/service.ts` into:
  - `src/features/scheduling/rotation-assignment-core-helpers.ts`
- moved reusable blocks:
  - tenant-scoped template resolver loop
  - shared weekday-set validation
  - generated-window overlap preflight checks
  - generated-window schedule creation loop
- rewired scheduling service call sites through dependency callbacks to preserve behavior.
- reduced `src/features/scheduling/service.ts` line count from 2950 to 2867.
- added `e2e-wi0656` regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0656-scheduling-rotation-assignment-core-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0653-scheduling-rotation-fairness-core-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0058-scheduling-rotation-optimization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0059-scheduling-rotation-fairness.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0063-scheduling-global-fairness-constraints.test.ts`
- `npm.cmd run typecheck`
