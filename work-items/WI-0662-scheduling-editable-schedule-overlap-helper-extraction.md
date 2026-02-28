# WI-0662 Scheduling Editable Schedule Overlap Helper Extraction

## Summary
- extracted strict schedule-overlap selection logic from
  `src/features/scheduling/service.ts` into:
  - `src/features/scheduling/schedule-overlap-helpers.ts`
- moved shared overlap filter logic used by both:
  - `createWorkSchedule`
  - `updateWorkSchedule`
- rewired both schedule write paths to use the shared helper with optional `excludeScheduleId` support for update flows.
- kept overlap conflict payload/output behavior unchanged.
- added WI-0662 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UI behavior changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0662-scheduling-editable-schedule-overlap-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0040-scheduling.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0042-scheduling-update.test.ts`
- `npm.cmd run typecheck`
