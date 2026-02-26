# WI-0553: Withholding Receipt Document Metadata Copy Action

## Summary
- Goal: add a practical self-service action to copy issued withholding document metadata for support/reporting handoff.
- Scope:
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - `src/components/withholding-receipt/WithholdingReceiptPanels.tsx`
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `scripts/tests/e2e-wi0553-withholding-receipt-document-metadata-copy-action.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `Copy Document Metadata` action in withholding summary panel.
- Wired callback from console to copy receipt metadata through clipboard API.
- Added locale copy keys for button label and copied-status message.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0553-withholding-receipt-document-metadata-copy-action.test.ts`
