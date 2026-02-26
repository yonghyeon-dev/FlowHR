# WI-0554: Employee Payslip Receipt Status Summary and Filter Helper Extraction

## Summary
- Goal: improve payslip receipt list readability with status summary while preserving console line budget.
- Scope:
  - `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
  - `src/components/payslip-receipts/payslip-receipt-filter-helpers.ts`
  - `src/components/payslip-receipts/copy.ts`
  - `scripts/tests/e2e-wi0554-employee-payslip-receipt-status-summary-and-filter-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted runs filtering/search/counting logic to `payslip-receipt-filter-helpers.ts`.
- Added status summary line (`pending / confirmed / undistributed`) in runs panel.
- Kept `PayslipReceiptConsole.tsx` within existing <=300 line guard.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0554-employee-payslip-receipt-status-summary-and-filter-helper-extraction.test.ts`
