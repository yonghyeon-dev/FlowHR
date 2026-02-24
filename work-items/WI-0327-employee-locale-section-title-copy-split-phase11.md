# WI-0327: Employee Locale Section Title Copy Split Phase 11

## Background

`src/app/employee/page.tsx` still kept direct locale ternary branches for
section `<h2>` titles. This left residual mixed locale logic in page-level JSX.

## Scope

- Add locale-aware section title copy bundle in
  `src/app/employee/page-locale-helpers.ts` under `surfaceCopy.sectionTitles`.
- Rewire `src/app/employee/page.tsx` section title rendering to use
  `sectionTitles.*` and remove direct `isKoLocale` ternary branches.
- Add WI-0327 regression coverage.

## Out of Scope

- New employee self-service features
- UI layout/style changes
- API/schema/contract changes

## Acceptance

1. Employee locale helper exports section-title copy for `ko`/`en`.
2. Employee page uses `sectionTitles` bundle for attendance/leave/calendar/
   schedule/api-log `<h2>` titles.
3. WI-0327 regression and build checks pass.

## Notes

- Related issue: `#423`
- UI copy rewire only (no behavioral change)
