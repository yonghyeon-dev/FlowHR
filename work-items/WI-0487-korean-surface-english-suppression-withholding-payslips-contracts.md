# WI-0487: Korean Surface English Suppression for Withholding, Payslips, and Contracts

## Summary
- Goal: remove remaining English-heavy runtime surface exposure in Korean locale for withholding receipt, payslip detail, and employee contracts inbox.
- Scope:
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - `src/components/withholding-receipt/WithholdingReceiptPanels.tsx`
  - `src/app/employee/payslips/page-view.tsx`
  - `src/app/employee/payslips/page-view-detail-panel.tsx`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `scripts/tests/e2e-wi0487-korean-surface-english-suppression-withholding-payslips-contracts.test.ts`
  - `ROADMAP.md`

## Delivery
- Added withholding issued-document file name normalization for ko runtime:
  - `normalizeWithholdingDocumentFileName(...)` in `copy-runtime.ts`
  - fallback file name shape: `원천징수영수증-{receiptNumber}.{ext}`
- Wired normalized withholding file names into:
  - status feedback after document load
  - summary panel document-file row
  - download anchor filename
- Added `documentPreviewHiddenNotice` copy and suppressed raw document-content preview in ko runtime to avoid raw English-key leakage on user surface.
- Suppressed raw deduction-breakdown JSON preview on `/employee/payslips` when locale is ko (keeps deduction explanation cards as the primary localized surface).
- Normalized employee contracts evidence download filename with existing `normalizeContractsEvidenceFileName(...)` helper for ko runtime.
- Added regression test for source wiring and helper behavior.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0487-korean-surface-english-suppression-withholding-payslips-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0486-korean-runtime-localization-sweep-year-end-payslips-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0484-korean-runtime-mixed-language-suppression-payslip-receipts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0483-korean-runtime-mixed-language-suppression-withholding-payslip-contracts.test.ts`
