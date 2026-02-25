# WI-0470: Korean Copy UTF-8 Recovery for Withholding/Payslip/Contracts

## Summary
- Goal: fix mojibake/broken Korean UI text in the highest-impact self-service payroll journey surfaces.
- Scope:
  - Recover Korean locale copy in:
    - withholding receipt
    - payslip receipts
    - contracts inbox/admin/template builder
  - Normalize key terminology (`직원 번호`, `조직 식별자`, `콘텐츠 해시값`, etc.).
  - Keep English locale copy unchanged.

## Delivery
- Updated `src/components/withholding-receipt/copy-runtime.ts`
  - Replaced broken Korean literals with UTF-8 Korean copy.
  - Normalized runtime validation/error fallback Korean messages.
  - Normalized Korean blocking-reason dictionary labels.
- Updated `src/components/payslip-receipts/copy.ts`
  - Replaced broken Korean literals in status/filter/log labels.
  - Removed residual English token in Korean placeholder (`Bearer` -> `액세스` 표현).
- Updated `src/components/contracts/copy.ts`
  - Replaced broken Korean literals across:
    - admin workspace copy
    - template builder copy
    - employee inbox copy
  - Preserved existing locale map structure and English fallback copy.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
