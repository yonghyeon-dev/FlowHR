# WI-0427: Korean Runtime Residual Hardening (Withholding/Payslip Receipts/Contracts)

## Summary
- Goal: remove remaining Korean-runtime English leak points in key payroll/contract surfaces.
- Change:
  - Added payslip-receipts runtime message normalizer and applied it to Supabase session error rendering.
  - Normalized withholding Korean wording (`프리뷰` -> `미리보기`).
  - Normalized contracts employee response label (`코멘트` -> `의견`).
- Outcome:
  - Korean runtime fallback remains Korean-first even when upstream error payloads are English-heavy.

## Scope
- `src/components/payslip-receipts/runtime-copy-helpers.ts`
- `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `src/components/contracts/copy.ts`
- `scripts/tests/e2e-wi0427-korean-runtime-residual-hardening-withholding-payslip-receipts-contracts.test.ts`
- `work-items/WI-0427-korean-runtime-residual-hardening-withholding-payslip-receipts-contracts.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0427-korean-runtime-residual-hardening-withholding-payslip-receipts-contracts.test.ts`
