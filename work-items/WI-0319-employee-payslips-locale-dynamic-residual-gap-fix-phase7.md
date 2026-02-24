# WI-0319: Employee Payslips Locale Dynamic Residual Gap Fix Phase 7

## Background

After WI-0316 and WI-0318, `src/app/employee/payslips/page.tsx` still included
many hardcoded section labels/status strings. Browser locale switching worked for
part of the page but not all visible copy.

## Scope

- Add page-level locale copy bundle in:
  - `src/app/employee/payslips/page-locale-helpers.ts`
- Move remaining hardcoded payslip UI strings to locale-aware copy.
- Localize payroll run state labels (`CONFIRMED`, `PREVIEWED`) in UI and search.
- Localize deduction description map via helper.
- Add WI-0319 regression test coverage.

## Out of Scope

- API/schema/contract changes
- New payslip features or workflow expansion
- Payroll domain calculation changes

## Acceptance

1. Payslip page core sections render from locale copy (`ko`/`en`) instead of
   fixed literals.
2. State badge/search use locale-aware state labels.
3. Deduction description labels/descriptions are locale-aware.
4. WI-0319 regression and build checks pass.

## Notes

- Related issue: `#407`
- UI locale hardening WI (no contract change)
