# WI-0324: Employee Locale Summary Copy Split Phase 10

## Background

After WI-0322, employee self-service validation/error text was localized via
helper bundles, but summary/projection/unit labels still had inline page-level
locale ternaries and hardcoded copy.

## Scope

- Extend `src/app/employee/page-locale-helpers.ts` with a `summaryCopy` bundle
  for:
  - leave balance summary and projection copy
  - leave balance card labels/unit formatting
  - leave unit label formatting (`hour`/`half-day`/`day`)
- Rewire `src/app/employee/page.tsx` to consume `summaryCopy` for remaining
  summary/status text.
- Add WI-0324 regression coverage.

## Out of Scope

- API/schema/contract changes
- Section title copy pattern changes
- New employee workflow/routes

## Acceptance

1. Employee summary/projection/unit copy is resolved via helper bundle
   (`summaryCopy`) for `ko`/`en`.
2. Inline summary hardcoded Korean/English strings are removed from page logic.
3. WI-0324 regression and build checks pass.

## Notes

- Related issue: `#417`
- UI locale hardening only (no contract version bump)
