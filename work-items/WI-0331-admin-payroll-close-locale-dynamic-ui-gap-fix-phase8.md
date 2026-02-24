# WI-0331: Admin Payroll Close Locale Dynamic UI Gap Fix Phase 8

## Background

`/admin/payroll-close` still used fixed English labels and `ko-KR`-only
formatting in status/log/totals surfaces, causing locale mismatch for
non-Korean browser settings.

## Scope

- Add locale copy bundle:
  - `src/components/payroll-close/copy.ts`
- Rewire `src/components/payroll-close/PayrollClosePeriodConsole.tsx` to:
  - consume `useI18n` locale (`ko`/`en`)
  - resolve page copy from locale bundle
  - apply runtime-locale datetime/number formatting (`ko-KR`/`en-US`)
- Update shared formatter signature:
  - `src/components/payroll-close/types.ts` (`formatKrw(value, runtimeLocale)`)
- Add WI-0331 regression coverage.

## Out of Scope

- Payroll close API/domain logic changes
- New workflow behavior or additional route creation

## Acceptance

1. Payroll close screen renders locale-aware copy (`ko`/`en`) for hero/input/
   run-state/totals/log surfaces.
2. Fixed English literals are removed from the touched screen source.
3. Status/log timestamp and KRW formatting follow runtime locale.
4. WI-0331 regression and build checks pass.

## Notes

- Related issue: `#431`
- UI copy/localization hardening only (no backend behavior change)
