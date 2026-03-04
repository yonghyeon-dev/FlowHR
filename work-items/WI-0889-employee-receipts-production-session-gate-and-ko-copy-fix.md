# WI-0889 Employee Receipts Production Session Gate and KO Copy Fix

## Summary
- Enforced product-mode login-session requirements on employee payslip-receipt and withholding-receipt workspaces.
- Restricted actor-header fallback (`x-actor-*`) to devtools or non-production runtime only.
- Fixed broken Korean labels in payroll insurance session context copy.

## Scope
- `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
- `src/components/payslip-receipts/copy.ts`
- `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
- `src/components/withholding-receipt/useWithholdingReceiptRequests.ts`
- `src/components/withholding-receipt/WithholdingReceiptInputPanel.tsx`
- `src/components/withholding-receipt/copy-runtime.ts`
- `src/components/payroll-insurance/PayrollInsuranceSettlementInputPanel.tsx`
- `scripts/tests/e2e-wi0889-employee-receipts-production-session-gate-and-ko-copy-fix.test.ts` (new)

## Acceptance
1. In production runtime with devtools disabled and no bearer session, payslip-receipt/withholding-receipt actions are blocked and `/login` guidance is shown.
2. Header-based actor fallback remains available only in devtools or non-production runtime.
3. Payroll insurance input panel Korean session labels render as readable product copy.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0701-payroll-receipt-session-identity-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0711-employee-payslip-receipt-session-context-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0889-employee-receipts-production-session-gate-and-ko-copy-fix.test.ts`
- `npm.cmd run build`

