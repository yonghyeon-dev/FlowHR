# WI-0314: Employee Locale Dynamic UI Gap Fix Phase 4 and Locale Helper Split

## Background

`src/app/employee/page.tsx` still had Korean-only inline constants/messages
for multiple employee panels. This created locale mismatch in `en` browser
settings and kept locale concerns mixed with page flow logic.

## Scope

- Add `src/app/employee/page-locale-helpers.ts` for:
  - locale label bundle resolution (`ko`/`en`)
  - weekday/note preset locale variants
  - locale-aware delta/error helper utilities
- Rewire `src/app/employee/page.tsx` to consume locale helpers.
- Localize residual panel copy in attendance/leave/calendar/schedule sections.
- Add WI-0314 regression coverage.

## Out of Scope

- API/schema/contract changes
- New employee feature flows
- Payroll domain behavior changes

## Acceptance

1. Employee page imports and uses `page-locale-helpers`.
2. Korean-only inline weekday/note preset constants are removed from page file.
3. Locale runtime text behavior is dynamic for major employee panels.
4. WI-0314 regression and build checks pass.

## Notes

- Related issue: `#397`
- UI locale gap fix + page decomposition alignment WI
