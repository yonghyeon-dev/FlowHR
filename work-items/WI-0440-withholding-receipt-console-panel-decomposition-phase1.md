# WI-0440: Withholding Receipt Console Panel Decomposition (Phase 1)

## Summary
- Goal: reduce `WithholdingReceiptConsole` growth while preserving runtime locale/copy guard anchors.
- Scope:
  - extract summary/log render blocks to dedicated panel components
  - consolidate API request/log boilerplate into `runRequest`
  - keep Korean runtime/copy pattern anchors in console for existing regression suites.

## Delivery
- Added `src/components/withholding-receipt/WithholdingReceiptPanels.tsx`
  - `WithholdingSummaryPanel`
  - `WithholdingLogsPanel`
- Updated `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - panel rendering delegated to extracted components
  - shared request execution helper (`runRequest`) and error guard (`isErrorPayload`) introduced
  - preserved test anchors:
    - `withholdingReceiptCopyByLocale`
    - `withholdingBlockingReasonKoMap`
    - `normalizeRuntimeDiagnosticMessage` flow
    - `resolveWithholdingBlockingReasons(receipt.receipt.blockingReasons, locale)`
    - `formatDateTimeByLocale(finalizedSettlement.settlement.finalizedAt, runtimeLocale)`
    - `resolveDocumentFormatLabel(receiptDocument.document.format)`
    - `resolveContentTypeLabel(receiptDocument.document.contentType)`
  - line count reduced: 711 -> 660.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0187-payroll-year-end-withholding-receipt-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0293-employee-withholding-receipt-locale-dynamic-ui.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0413-korean-label-normalization-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0427-korean-runtime-residual-hardening-withholding-payslip-receipts-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0432-korean-runtime-latin-fallback-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0440-withholding-receipt-console-panel-decomposition-phase1.test.ts`
