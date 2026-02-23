# WI-0299: Admin Locale Dynamic UI Gap Fix Baseline

## Background

Even after prior locale rollout, `/admin` still had several hard-coded English literals.
This WI closes high-visibility locale gaps without changing workflows.

## Scope

- Apply `useI18n` locale signal in `src/app/admin/page.tsx`.
- Localize visible literals:
  - queue labels (all/attendance/leave/payroll)
  - work/holiday status text in schedule list
  - API log success/fail labels
  - fallback text (`not configured`) and update marker (`updated`)
  - invite role label for `payroll_operator`
- Keep queue search-sort row labels locale-aware via `src/app/admin/page-queue-helpers.ts`.

## Out of Scope

- New admin features
- API/contract changes
- Additional ops workflow expansion

## Acceptance

1. `/admin` reflects browser locale for targeted high-visibility strings.
2. Queue search/sort labels are locale-aware.
3. Typecheck, locale regression, and build pass.

## Notes

- Related issue: `#367`
- UI text-only change (no contract bump required)
