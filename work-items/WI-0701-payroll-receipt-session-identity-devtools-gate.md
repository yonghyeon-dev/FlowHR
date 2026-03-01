# WI-0701 Payroll/Receipt Session Identity Devtools Gate

## Summary
- gated read-only session identity metadata behind
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` in payroll/receipt input panels:
  - `src/components/withholding-receipt/WithholdingReceiptInputPanel.tsx`
  - `src/components/payroll-insurance/PayrollInsuranceSettlementInputPanel.tsx`
- propagated `showDevTools` props from consoles:
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - `src/components/payroll-insurance/PayrollInsuranceSettlementConsole.tsx`
- kept request/auth/runtime logic unchanged; only product-mode UI exposure was reduced.

## Scope
- payroll/receipt UI exposure control only
- no API/schema/contract changes
- no ops route changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0701-payroll-receipt-session-identity-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0627-employee-tax-receipt-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0633-admin-payroll-insurance-session-context-productization.test.ts`
- `npm.cmd run typecheck`
