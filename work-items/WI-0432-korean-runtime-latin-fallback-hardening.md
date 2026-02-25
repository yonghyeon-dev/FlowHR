# WI-0432: Korean Runtime Latin Fallback Hardening

## Summary
- Goal: remove remaining Korean-locale runtime paths where raw English diagnostics can leak to UI.
- Scope:
  - tighten runtime diagnostic fallback rule in withholding/payslip/payslip-receipt/contracts paths
  - switch from ASCII-ratio heuristic to deterministic Latin-token suppression in Korean locale.

## Delivery
- Updated Korean runtime message normalizers:
  - `src/app/employee/payslips/page-locale-helpers.ts`
  - `src/components/payslip-receipts/runtime-copy-helpers.ts`
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - `src/components/contracts/http.ts`
- Rule change:
  - before: fallback only when message was "ASCII-heavy"
  - after: in `ko` runtime, if message has no Hangul and contains Latin letters, force Korean fallback.

## Result
- Korean locale now suppresses more English diagnostic leftovers consistently across:
  - 원천징수 영수증
  - 급여명세서/수신확인
  - 전자계약함

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0414-korean-runtime-fallback-guard-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0429-korean-runtime-message-and-contract-title-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0432-korean-runtime-latin-fallback-hardening.test.ts`
