# WI-0713 Korean Runtime Copy Guard (Withholding/Payslip/Contracts)

## Summary
- added a regression guard test that verifies Korean runtime copy remains applied on
  key employee finance/contract surfaces:
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `src/components/payslip-receipts/copy.ts`
  - `src/components/contracts/copy.ts`
  - `src/app/employee/payslips/page-locale-search-sort-copy.ts`
- this prevents accidental English fallback regressions in KO locale for critical
  labels and section titles.

## Scope
- copy regression guard only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0713-ko-runtime-copy-guard-finance-contracts.test.ts`
- `npm.cmd run typecheck`
