# WI-0310: Locale Dynamic UI Residual Gap Fix (Admin/Employee Core Surfaces)

## Background

After WI-0307, several admin/employee dashboard surfaces still exposed mixed
copy in Korean flow (for example untranslated button labels, partial English
terms, and inconsistent aria/placeholder wording across components).

## Scope

- Normalize locale-aware copy on core dashboard components:
  - `src/components/admin-dashboard/*`
  - `src/components/employee-dashboard/*`
  - supporting label dictionaries in:
    - `src/app/admin/page.tsx`
    - `src/app/employee/page.tsx`
- Keep behavior unchanged; string-only hardening for `ko`/`en` dynamic UI.
- Add WI-0310 regression test coverage.

## Out of Scope

- New product features
- Backend/API/schema changes
- Large page decomposition or architecture migration

## Acceptance

1. No mixed Korean+English labels remain in the touched core dashboard copy for
   Korean locale flow.
2. Locale-aware labels (`ko`/`en`) are consistently applied for visible text
   and key aria/placeholder copy in touched components.
3. WI-0310 regression and build checks pass.

## Notes

- Related issue: `#389`
- Customer-facing locale consistency hardening WI
