# WI-0401: Korean Copy Residual Sweep (Withholding/Payslip/Contracts)

## Summary
- 대상 범위: `원천징수`, `명세서 수령`, `전자계약함` 한국어 표기 잔존 이슈 전수 정리.
- Removed remaining hardcoded English surface labels in Korean copy where they were still user-facing (`API 로그` -> `요청 로그`, empty-log copy normalization).
- Replaced hardcoded English aria label in contracts workspace with locale copy (`copy.summaryKpiAria`).
- Added a regression guard that scans Korean locale copy blocks in withholding/payslip-receipt/contracts surfaces and fails when unexpected English tokens are reintroduced.

## Scope
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `src/components/payslip-receipts/copy.ts`
- `src/components/contracts/copy.ts`
- `src/components/contracts/AdminContractsWorkspace.tsx`
- `scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- `package.json`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0293-employee-withholding-receipt-locale-dynamic-ui.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
