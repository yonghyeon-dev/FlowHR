# WI-0481: Korean Copy Residual Runtime Hardening (Withholding/Payslip/Contracts)

## Summary
- Goal: fix user-facing mojibake/garbled copy and locale fallback regressions in withholding, payslip, and contracts surfaces.
- Scope:
  - `src/app/employee/payslips/page-locale-page-copy.ts`
  - `src/app/employee/payslips/page-locale-search-sort-copy.ts`
  - `src/app/employee/payslips/page-locale-deduction-copy.ts`
  - `src/app/employee/payslips/page-locale-runtime.ts`
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - `src/components/contracts/journey-copy.ts`
  - `src/components/contracts/runtime-copy-helpers.ts`
  - `src/lib/i18n/employee-id-locale.ts`

## Delivery
- Restored broken Korean copy in payslip locale modules (`page`, `search/sort`, `deduction`, `runtime`) and corrected KRW/unit/date runtime formatting.
- Normalized contracts journey/recovery copy and Korean fallback title generation (`계약서 {id}`).
- Restored Korean employee-id locale prefix (`직원-`) and related conversion helpers.
- Fixed withholding runtime fallback labels:
  - KRW suffix (`원`)
  - content-type labels (`구조 데이터`, `텍스트 데이터`)
  - session error fallback
- Replaced broken separator token in payslip filter panel (`쨌` -> `·`).
- Updated legacy employee-id locale tests (WI-0471/WI-0472) to assert canonical Korean outputs.
- Added WI-0481 regression test to lock corrected Korean runtime copy and locale formatting behavior.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0481-korean-copy-residual-runtime-hardening-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0471-korean-locale-employee-id-input-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0472-contracts-employee-id-locale-display-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0480-korean-regression-suite-alignment-after-payslips-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0318-employee-payslips-locale-helper-split-phase6.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0319-employee-payslips-locale-dynamic-residual-gap-fix-phase7.test.ts`
- [x] `npm.cmd run -s typecheck`
