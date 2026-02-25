# WI-0413: Korean Label Normalization for Withholding/Payslip/Contracts

## Summary
- Goal: remove residual English-oriented labels in Korean runtime for withholding receipt and payslip detail flows, and verify contracts Korean copy remains stable.
- Change:
  - Updated Korean payslip copy in `src/app/employee/payslips/page-locale-helpers.ts`:
    - `API 호출` -> `요청 호출`
    - `CSV 다운로드` -> `표 내려받기`
    - `최근 API 상태` -> `최근 요청 상태`
    - `인쇄/PDF 저장` -> `인쇄/문서 저장`
    - `PDF 파일명 복사` -> `문서 파일명 복사`
    - `공제 원본(JSON)` -> `공제 원본(구조 데이터)`
  - Updated `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`:
    - Added Korean display mapping for document `format` and `contentType`
    - `application/json` -> `구조 데이터`, `text/plain` -> `텍스트 데이터`
  - Verified key Korean labels in contracts copy remain intact (`전자계약 워크스페이스`, `내 계약함`).
- Outcome:
  - Korean locale surfaces in withholding/payslip no longer expose raw English technical labels in primary UI copy.

## Scope
- `src/app/employee/payslips/page-locale-helpers.ts`
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `scripts/tests/e2e-wi0413-korean-label-normalization-withholding-payslip-contracts.test.ts`
- `work-items/WI-0413-korean-label-normalization-withholding-payslip-contracts.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0293-employee-withholding-receipt-locale-dynamic-ui.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0393-employee-payslips-utf8-encoding-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0405-payslip-contracts-residual-english-token-cleanup.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0413-korean-label-normalization-withholding-payslip-contracts.test.ts`
