# WI-0708 KO Runtime Fallback Normalization for Contracts/Withholding

## Summary
- fixed corrupted Korean fallback strings in:
  - `src/components/contracts/runtime-copy-helpers.ts`
  - `src/components/withholding-receipt/runtime-label-helpers.ts`
- normalized KO fallback outputs so employee contracts inbox and withholding receipt
  runtime labels render readable Korean text.
- kept API/auth/request behavior unchanged.

## Scope
- KO runtime label/fallback normalization only
- no API/schema/contract changes
- no ops route changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0708-ko-runtime-fallback-normalization-for-contracts-withholding.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0617-korean-runtime-guard-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0640-korean-surface-copy-completion-for-tax-receipt-payslip-contracts.test.ts`
- `npm.cmd run typecheck`
