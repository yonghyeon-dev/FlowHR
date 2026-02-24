# WI-0351: Leave calendar cell click prefill leave form

## Summary
- Added leave-calendar day cell click interaction that prefills leave request form inputs.
- Wired callback from employee dashboard panel to page-level leave draft state.
- Added locale copy + clickable calendar cell styles for accessibility (`click`, `Enter`, `Space`).

## Scope
- `src/app/employee/page.tsx`
- `src/components/employee-dashboard/EmployeeAttendanceLeavePanels.tsx`
- `src/app/employee/page-locale-helpers.ts`
- `src/app/globals.css`
- `scripts/tests/e2e-wi0351-leave-calendar-cell-click-prefill-leave-form.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0351-leave-calendar-cell-click-prefill-leave-form.test.ts`
