# WI-0661 Scheduling Rotation Employee Optimization Helper Extraction

## Summary
- extracted employee-level rotation optimization orchestration from
  `src/features/scheduling/service.ts` into:
  - `src/features/scheduling/rotation-employee-optimization-helpers.ts`
- moved reusable employee-evaluation flow:
  - template/employee organization scope validation
  - optimization period normalization (`fromDate`/`toDate`)
  - existing schedule lookup for target employee
  - offset evaluation ranking and best-option selection
- rewired `evaluateBestRotationForEmployee` in scheduling service to delegate orchestration to helper while preserving existing scoring callbacks and behavior.
- reduced `src/features/scheduling/service.ts` line count from 2629 to 2620.
- added WI-0661 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UI behavior changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0661-scheduling-rotation-employee-optimization-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0058-scheduling-rotation-optimization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0059-scheduling-rotation-fairness.test.ts`
- `npm.cmd run typecheck`
