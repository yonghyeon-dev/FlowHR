# WI-0320: Employee Locale Dynamic Residual Gap Fix Phase 8

## Background

After WI-0314, `src/app/employee/page.tsx` still had repeated inline locale
ternaries in attendance/leave/calendar/schedule/API log sections. Browser locale
switching worked, but several high-visibility UI labels remained hardcoded at
the page layer.

## Scope

- Extend `src/app/employee/page-locale-helpers.ts` with a `surfaceCopy` bundle
  for attendance/leave/calendar/schedule/API log panel copy.
- Rewire `src/app/employee/page.tsx` to use helper-based locale copy for
  residual panel labels/buttons/aria text.
- Keep section title patterns used by prior regression checks unchanged.
- Add WI-0320 regression coverage.

## Out of Scope

- API/schema/contract changes
- New employee self-service flows
- Deep validation-message refactor outside panel-surface copy

## Acceptance

1. Employee panel-surface copy uses helper-based locale bundle (`ko`/`en`)
   instead of repeated inline ternaries.
2. Attendance/leave/calendar/schedule/API log sections render dynamic locale
   text via `surfaceCopy`.
3. WI-0320 regression and build checks pass.

## Notes

- Related issue: `#409`
- UI locale residual hardening WI (no contract change)
