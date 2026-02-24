# WI-0332: Admin Payroll Insurance Locale Dynamic UI Gap Fix Phase 9

## Background

`/admin/payroll-insurance` still exposed fixed English labels and fixed-locale
(`ko-KR`) formatting, which broke browser-locale based UI consistency.

## Scope

- Add locale copy bundle:
  - `src/components/payroll-insurance/copy.ts`
- Split insurance settlement UI sections for size budget:
  - `src/components/payroll-insurance/PayrollInsuranceSettlementInputPanel.tsx`
  - `src/components/payroll-insurance/PayrollInsuranceSettlementSections.tsx`
- Rewire `src/components/payroll-insurance/PayrollInsuranceSettlementConsole.tsx`
  to:
  - consume `useI18n` locale (`ko`/`en`)
  - resolve copy from locale bundle
  - apply runtime-locale datetime/number formatting
- Update shared formatter signature:
  - `src/components/payroll-insurance/types.ts` (`formatKrw(value, runtimeLocale)`)
- Add WI-0332 regression coverage.

## Out of Scope

- Insurance settlement API/domain logic changes
- New route creation or workflow expansion

## Acceptance

1. Payroll insurance screen renders locale-aware copy (`ko`/`en`) for hero/input/
   summary/components/log surfaces.
2. Fixed English literals are removed from touched component surfaces.
3. Runtime locale (`ko-KR`/`en-US`) is used for logs and KRW formatting.
4. WI-0332 regression and build checks pass.

## Notes

- Related issue: `#433`
- UI copy/localization hardening only (no backend behavior change)
