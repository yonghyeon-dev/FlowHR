# WI-0486: Korean Runtime Localization Sweep for Year-End, Payslips, and Contracts

## Summary
- Goal: remove remaining English runtime exposure in Korean locale flows across year-end withholding, payslip file naming, and contracts evidence display.
- Scope:
  - `src/components/payroll-year-end/runtime-copy-helpers.ts`
  - `src/components/payroll-year-end/PayrollYearEndConsole.tsx`
  - `src/components/payroll-year-end/PayrollYearEndPreflightConsole.tsx`
  - `src/components/payroll-year-end/EmployeeYearEndInputConsole.tsx`
  - `src/components/payroll-year-end/employee-year-end-input-copy.ts`
  - `src/components/payroll-year-end/types.ts`
  - `src/app/employee/payslips/use-payslip-derived-state.ts`
  - `src/app/employee/payslips/page.tsx`
  - `src/components/contracts/runtime-copy-helpers.ts`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `scripts/tests/e2e-wi0486-korean-runtime-localization-sweep-year-end-payslips-contracts.test.ts`
  - `ROADMAP.md`

## Delivery
- Added payroll year-end runtime localization helpers:
  - error/session diagnostic normalization for ko runtime
  - reconciliation status label mapping
  - reason code label mapping
  - blocking reason mapping/normalization
- Applied helper in year-end admin/employee consoles:
  - `PayrollYearEndConsole`, `PayrollYearEndPreflightConsole`, `EmployeeYearEndInputConsole`
  - replaced raw `supabaseSessionError` exposure with normalized ko diagnostics
  - replaced raw reason/status/blocking strings with locale-aware labels
- Added `bearerTokenPlaceholder` to employee year-end input copy and removed hardcoded `Bearer token` UI text.
- Updated payroll KRW formatter in year-end types to locale-aware unit suffix (`원`/` KRW`).
- Updated payslip file names in ko runtime:
  - recommended PDF filename prefix
  - downloaded CSV filename prefix
- Added contracts evidence filename normalization for ko runtime display.
- Added regression test to guard new localization behavior and source wiring.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0486-korean-runtime-localization-sweep-year-end-payslips-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0485-payroll-accuracy-regression-bundle-and-admin-evidence.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0483-korean-runtime-mixed-language-suppression-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0484-korean-runtime-mixed-language-suppression-payslip-receipts.test.ts`
- [x] `npm.cmd run -s typecheck`
