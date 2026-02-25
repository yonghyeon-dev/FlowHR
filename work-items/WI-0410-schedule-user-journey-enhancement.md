# WI-0410: Schedule User Journey Enhancement

## Summary
- Goal: strengthen `/employee/schedule` core user journey without adding phase-style stacked surfaces.
- Change:
  - Added schedule journey filters (status + holiday) and quick range actions (current month/week, next week).
  - Added next-shift card and status-aware schedule listing (`upcoming`, `in_progress`, `completed`).
  - Added scheduling helper functions for week range presets and time-status derivation.
  - Split employee schedule UI into orchestrator/view pair while keeping each component <= 300 lines.
- Outcome:
  - Employee schedule page now supports practical daily flow: pick range quickly -> filter by current focus -> inspect next shift -> review matching list.

## Scope
- `src/components/scheduling/EmployeeScheduleBoard.tsx`
- `src/components/scheduling/EmployeeScheduleBoardView.tsx`
- `src/components/scheduling/copy.ts`
- `src/components/scheduling/helpers.ts`
- `scripts/tests/e2e-wi0410-schedule-user-journey-enhancement.test.ts`
- `work-items/WI-0410-schedule-user-journey-enhancement.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0397-scheduling-dedicated-admin-employee-workspace-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0410-schedule-user-journey-enhancement.test.ts`
- `npm.cmd run -s build`
