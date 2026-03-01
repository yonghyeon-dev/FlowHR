# WI-0711 Employee Payslip Receipt Session Context Devtools Gate

## Summary
- hid read-only session organization/employee identifiers in
  `src/components/payslip-receipts/PayslipReceiptConsole.tsx` for product mode.
- kept the session context row visible only when `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` is enabled.
- preserved receipt list/acknowledgement workflow and API request behavior.

## Scope
- employee payslip receipt workspace productization only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0711-employee-payslip-receipt-session-context-devtools-gate.test.ts`
- `npm.cmd run typecheck`
