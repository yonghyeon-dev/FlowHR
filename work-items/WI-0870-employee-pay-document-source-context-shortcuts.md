# WI-0870 Employee Pay Document Source-Context Shortcuts

## Summary
- Extended employee dashboard pay hub links with source-context query so pay document workspaces can preserve entry context.
- Added direct employee dashboard shortcut to `/employee/payslip-receipts` for receipt confirmation flow.
- Added source-entry hint + dashboard return action on payslip receipt and withholding receipt pages when opened via `source=employee-dashboard`.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `scripts/tests/e2e-wi0870-employee-pay-document-source-context-shortcuts.test.ts` (new)

## Acceptance
1. Employee pay workspace hub exposes deep links with `source=employee-dashboard` for payslips, payslip receipts, and withholding receipt.
2. Payslip receipt page shows source-entry hint and dashboard return action when opened from employee dashboard.
3. Withholding receipt page shows source-entry hint and dashboard return action when opened from employee dashboard.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0870-employee-pay-document-source-context-shortcuts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0711-employee-payslip-receipt-session-context-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0627-employee-tax-receipt-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0827-employee-dashboard-korean-copy-hub-normalization.test.ts`
- `npm.cmd run build`
