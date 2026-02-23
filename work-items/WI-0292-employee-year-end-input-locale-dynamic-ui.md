# WI-0292: Employee Year-End Input Locale Dynamic UI

## Background

`/employee/year-end-input` was rendering fixed English copy for major UI labels/messages.
This reduced consistency with browser-language based locale switching already used in core shell/navigation.

## Scope

- Apply locale-aware copy wiring (`ko`/`en`) in:
  - `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
- Use `useI18n()` locale context and runtime locale mapping (`ko-KR`/`en-US`) for log timestamps.
- Keep API payload/endpoint behavior unchanged.
- Add regression coverage:
  - `scripts/tests/e2e-wi0292-employee-year-end-input-locale-dynamic-ui.test.ts`

## Out of Scope

- Year-end tax formula, cap, or settlement rule changes
- New payroll API endpoints
- Ops tooling expansion

## Acceptance

1. Browser locale context changes major UI copy on `/employee/year-end-input`.
2. API log timestamp locale follows selected runtime locale (`ko-KR` or `en-US`).
3. Regression test verifies locale-copy wiring and key localized labels.

## Notes

- Related issue: `#353`
- This WI is UI-only and intentionally avoids contract/schema version bumps.

