# WI-0588: Employee Schedule Conflict Quick Correction Action

## Summary
- Goal: connect schedule conflict guidance to an immediate employee self-service action.
- Scope:
  - `src/components/scheduling/copy.ts`
  - `src/components/scheduling/EmployeeScheduleBoardView.tsx`
  - `scripts/tests/e2e-wi0588-employee-schedule-conflict-quick-correction-action.test.ts`
  - `ROADMAP.md`

## Delivery
- Added locale copy key for schedule conflict follow-up CTA (`statusQuickCorrectionAction`).
- Added quick action button in employee schedule board:
  - shown only when conflict-candidate guidance is present and count is not zero
  - navigates directly to `'/employee#attendance'` for attendance correction request flow
- Kept scheduling board line budgets stable (`EmployeeScheduleBoard.tsx <= 260`, `EmployeeScheduleBoardView.tsx <= 290`).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0588-employee-schedule-conflict-quick-correction-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0531-employee-schedule-conflict-candidate-guidance.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
