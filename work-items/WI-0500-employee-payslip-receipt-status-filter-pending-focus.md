# WI-0500: Employee Payslip Receipt Status Filter and Pending Focus

## Summary
- Goal: improve employee self-service speed in `/employee/payslip-receipts` by adding run-status filtering with pending-queue visibility.
- Scope:
  - `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
  - `src/components/payslip-receipts/copy.ts`
  - `scripts/tests/e2e-wi0500-employee-payslip-receipt-status-filter-pending-focus.test.ts`
  - `ROADMAP.md`

## Delivery
- Added status filter for run list:
  - all
  - pending receipt confirmation
  - receipt confirmed
  - undistributed
- Combined status filter + search query filtering in a single derived list.
- Added pending-in-view counter to focus employees on actionable runs.
- Kept line-budget guardrail:
  - `PayslipReceiptConsole.tsx` remains <= 300 lines.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0186-payroll-payslip-delivery-receipt-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0439-employee-payslip-receipts-search-filter-and-line-budget-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0493-payslip-withholding-employee-id-default-restore-and-line-budget.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0500-employee-payslip-receipt-status-filter-pending-focus.test.ts`
- [x] `npm.cmd run typecheck`
