# WI-0394: Korean copy terminology normalization (withholding/payslip/contracts)

## Summary
- 대상 화면: `원천징수 영수증`, `급여명세 수신 확인`, `전자계약함`.
- Normalized Korean copy terminology across employee-facing payroll/contract surfaces:
  - `직원 ID` -> `직원 번호`
  - `Run` wording -> `실행`
  - `ID`/`SHA256` mixed labels -> Korean-oriented labels (`번호`, `해시값`)
- Localized withholding numeric input validation error so ko locale no longer emits english fallback text.
- Updated withholding receipt and payslip receipt locale copy to remove residual mixed-language/dev-fallback wording on ko surface.
- Hardened contracts ko locale bundle to avoid inheriting en defaults via spread and to keep explicit ko labels for inbox/detail/evidence fields.
- Added WI-0394 regression test to prevent terminology regression in the same surfaces.

## Scope
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `src/components/payslip-receipts/copy.ts`
- `src/components/contracts/copy.ts`
- `scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- `work-items/WI-0394-korean-copy-terminology-normalization-withholding-payslip-contracts.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0387-korean-copy-global-sweep-regression.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0293-employee-withholding-receipt-locale-dynamic-ui.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0335-contracts-locale-dynamic-ui-gap-fix.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0186-payroll-payslip-delivery-receipt-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- `npm.cmd run -s typecheck`
