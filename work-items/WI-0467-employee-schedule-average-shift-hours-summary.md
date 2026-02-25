# WI-0467: Employee Schedule Average Shift-Hours Summary

## Summary
- Goal: Improve employee schedule self-service by exposing per-shift average work hours in summary cards.
- Scope:
  - Add average shift-hours derived metric on `/employee/schedule`.
  - Keep existing filters and schedule load flow unchanged.
  - Maintain component line budgets.

## Delivery
- Updated `src/components/scheduling/EmployeeScheduleBoard.tsx`
  - Added `averageMinutesPerShift` derived metric:
    - `0` when no shifts
    - otherwise rounded to one decimal minute precision from `totalMinutes / totalShifts`
- Updated `src/components/scheduling/EmployeeScheduleBoardView.tsx`
  - Added summary row rendering average shift hours with existing `formatHours(...)`.
- Updated `src/components/scheduling/copy.ts`
  - Added locale copy key:
    - `summaryAverageShiftHours` (`ko`: `교대당 평균 근무 시간`, `en`: `Avg hours per shift`)
- Added `scripts/tests/e2e-wi0467-employee-schedule-average-shift-hours-summary.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0467-employee-schedule-average-shift-hours-summary.test.ts`
