# WI-0616: Employee attendance correction prefill from schedule context

## Background

WI-0615 added a direct CTA from `/employee/schedule` to `/employee#attendance` with
`attendanceSource=schedule&fromDate&toDate`, but the attendance correction form itself
did not consume that context.

## Scope

- Parse schedule context query parameters on `/employee`.
- Prefill attendance correction form fields when source is `schedule`:
  - `checkInAt`
  - `checkOutAt`
  - `attendanceNotes`
- If attendance records are already loaded, auto-select the most recent correction target
  record within the selected schedule date range.
- Add WI-0616 regression guard and roadmap entry.

## Out of Scope

- Scheduling domain/API changes
- Attendance correction API contract changes
- Additional CTA changes on `/employee/schedule`

## Acceptance Criteria

1. `/employee` recognizes `attendanceSource=schedule&fromDate&toDate`.
2. Attendance correction form is auto-prefilled once per query context.
3. Existing employee self-service submission and validation flows remain unchanged.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0616-employee-attendance-correction-prefill.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0615-employee-schedule-attendance-correction-cta.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0588-employee-schedule-conflict-quick-correction-action.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
