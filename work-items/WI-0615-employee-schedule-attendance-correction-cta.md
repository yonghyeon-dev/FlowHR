# WI-0615: Employee schedule attendance correction CTA

## Background

`/employee/schedule` already surfaces overlap/conflict guidance, but users still needed to manually navigate to
attendance correction on `/employee#attendance`.

## Scope

- Add explicit CTA in employee schedule workspace actions area.
- Link CTA to attendance correction section with context query params:
  - `attendanceSource=schedule`
  - `fromDate`
  - `toDate`
- Keep existing line-budget guard (`EmployeeScheduleBoardView.tsx <= 290`).
- Add WI-0615 regression guard and roadmap entry.

## Out of Scope

- Attendance correction form behavior changes
- Scheduling domain/API changes
- New copy keys (reuse existing localized CTA copy)

## Acceptance Criteria

1. Employee schedule page renders a visible button linking to `/employee#attendance` with schedule context.
2. CTA uses existing locale-aware copy (`statusQuickCorrectionAction`).
3. Existing schedule search/filter/export flows remain unchanged.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0615-employee-schedule-attendance-correction-cta.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0531-employee-schedule-conflict-candidate-guidance.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
