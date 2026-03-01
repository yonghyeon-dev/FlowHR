# WI-0715 Payroll Session Context Strict Devtools Gate

## Summary
- hid read-only session organization/actor identifiers in product mode for:
  - `src/components/payroll-close/PayrollClosePeriodConsole.tsx`
  - `src/components/payroll-payslip-delivery/PayrollPayslipDeliveryConsole.tsx`
  - `src/components/payroll-insurance/PayrollInsuranceSettlementInputPanel.tsx`
- session context rows now render only when `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` is enabled.

## Scope
- payroll workspace productization only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0715-payroll-session-context-strict-devtools-gate.test.ts`
- `npm.cmd run typecheck`
