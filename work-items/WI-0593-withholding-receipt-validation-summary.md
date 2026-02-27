# WI-0593: Withholding Receipt Validation Summary

## Summary
- Goal: make blocking/missing validation conditions immediately visible in the employee withholding receipt flow.
- Scope:
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - `src/components/withholding-receipt/WithholdingReceiptPanels.tsx`
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `scripts/tests/e2e-wi0593-withholding-receipt-validation-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added validation summary to withholding receipt summary panel:
  - blocked item count (`blockingReasons.length`)
  - missing guard count (previewed / undistributed / pending-receipt run guards)
  - validation status (`needs action` vs `ready`)
  - action hint when validation is not ready
- Added locale copy keys (`ko`/`en`) for validation summary labels and hints.
- Kept line budgets stable:
  - `WithholdingReceiptConsole.tsx <= 300`
  - `copy-runtime.ts <= 380`

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0593-withholding-receipt-validation-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0553-withholding-receipt-document-metadata-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0493-payslip-withholding-employee-id-default-restore-and-line-budget.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0504-runtime-line-budget-recovery-withholding-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
