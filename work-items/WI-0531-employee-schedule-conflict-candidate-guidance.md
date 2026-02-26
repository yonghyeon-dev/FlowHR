# WI-0531: Employee Schedule Conflict Candidate Guidance

## Summary
- Goal: provide immediate self-service guidance when schedule rows appear to overlap.
- Scope:
  - `src/components/scheduling/helpers.ts`
  - `src/components/scheduling/copy.ts`
  - `src/components/scheduling/EmployeeScheduleBoard.tsx`
  - `scripts/tests/e2e-wi0531-employee-schedule-conflict-candidate-guidance.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `countScheduleOverlapCandidates` helper for shift overlap candidate counting.
- Updated employee schedule load status to include:
  - overlap candidate count
  - follow-up tracking guidance via attendance correction request
- Expanded employee schedule copy keys for conflict/guide message composition.
- Kept `EmployeeScheduleBoard.tsx` and `EmployeeScheduleBoardView.tsx` within existing line budgets.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0467-employee-schedule-average-shift-hours-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0531-employee-schedule-conflict-candidate-guidance.test.ts`

