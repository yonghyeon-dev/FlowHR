# WI-0471: Korean Locale Employee ID Input Normalization

## Summary
- Goal: remove residual English-style default employee ID exposure from Korean payroll self-service screens while preserving API compatibility.
- Scope:
  - `/employee/withholding-receipt`
  - `/employee/payslip-receipts`
  - Locale helper for employee ID input/display normalization

## Delivery
- Added `src/lib/i18n/employee-id-locale.ts`
  - `getLocalizedEmployeeIdInputDefault(locale)`:
    - `ko` -> `직원-1001`
    - `en` -> `EMP-1001`
  - `normalizeEmployeeIdForApi(value, locale)`:
    - Converts localized Korean input (`직원-1001`) to API-safe ID (`EMP-1001`)
  - `normalizeEmployeeIdForLocaleInput(value, locale)`:
    - Syncs stored input shape when locale changes (`EMP-1001` <-> `직원-1001`)
- Updated `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - Replaced hardcoded employee ID default with locale helper default.
  - Applied locale-display normalization effect.
  - Applied API normalization in actor header/body/query flows.
- Updated `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
  - Replaced hardcoded employee ID default with locale helper default.
  - Applied locale-display normalization effect.
  - Applied API normalization in actor header/query flows.
- Added regression test:
  - `scripts/tests/e2e-wi0471-korean-locale-employee-id-input-normalization.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0465-korean-runtime-fetch-failure-guard-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0471-korean-locale-employee-id-input-normalization.test.ts`
