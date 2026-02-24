# WI-0333: Admin Payroll Year-End/Preflight/Payslip Delivery Locale Dynamic UI Gap Fix Phase 10

## Background

`/admin/payroll-year-end`, `/admin/payroll-year-end/preflight`, and
`/admin/payroll-payslip-delivery` still contained hardcoded English literals and
fixed-locale formatting, which caused browser-locale inconsistency.

## Scope

- Add locale copy bundles:
  - `src/components/payroll-year-end/copy.ts`
  - `src/components/payroll-payslip-delivery/copy.ts`
- Rewire consoles to locale runtime copy/formatting:
  - `src/components/payroll-year-end/PayrollYearEndConsole.tsx`
  - `src/components/payroll-year-end/PayrollYearEndPreflightConsole.tsx`
  - `src/components/payroll-payslip-delivery/PayrollPayslipDeliveryConsole.tsx`
- Update shared formatter signature:
  - `src/components/payroll-year-end/types.ts` (`formatKrw(value, runtimeLocale = "ko-KR")`)
- Update legacy literal-based e2e assertions for year-end/payslip UIs.
- Add WI-0333 regression coverage.

## Out of Scope

- Payroll domain/API behavior changes
- New route or workflow expansion

## Acceptance

1. Three admin payroll consoles render locale-aware copy (`ko`/`en`) via
   `useI18n`.
2. Runtime locale (`ko-KR`/`en-US`) is used for log timestamps and KRW
   formatting.
3. Hardcoded English heading literals are removed from touched UI surfaces.
4. Related regression tests and build/typecheck pass.

## Notes

- Related issue: `#435`
- UI copy/localization hardening only (no backend behavior change)
