# WI-0533: Scheduling Template Assignment Helper Reuse and Line-Budget Recovery

## Summary
- Goal: reduce `scheduling/service.ts` growth by reusing generated-window and creation helpers across template range/rotation assignment paths.
- Scope:
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0533-scheduling-template-assignment-helper-reuse-and-line-budget-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildTemplateRangeWindows` helper to unify template range window generation with existing rotation window builder.
- Replaced duplicated schedule creation loops in:
  - `assignWorkScheduleRangeFromTemplate`
  - `assignWorkScheduleRotation`
  with `createSchedulesFromGeneratedWindows`.
- Reused `buildRotationWindowsForTemplates` in rotation assignment path directly.
- Reduced line footprint while keeping assignment audit/event payload behavior unchanged.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0467-employee-schedule-average-shift-hours-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0533-scheduling-template-assignment-helper-reuse-and-line-budget-recovery.test.ts`

