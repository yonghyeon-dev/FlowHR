# WI-0695 Scheduling Rotation-Balance Actor Guard Helper Adoption

## Summary
- rewired `listWorkScheduleRotationBalance` in
  `src/features/scheduling/service.ts` to use shared
  `requireSchedulingActor(context)` instead of inline actor null-check.
- preserved unauthorized error semantics.
- added WI-0695 regression guard for helper adoption and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0695-scheduling-rotation-balance-actor-guard-helper-adoption.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0057-scheduling-rotation-balance-report.test.ts`
- `npm.cmd run typecheck`
