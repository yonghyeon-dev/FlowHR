# WI-0493: Payslip/Withholding Employee ID Default Restore and Line-Budget Recovery

## Summary
- Goal: recover failing core line-budget gates and harden locale employee-id input behavior for payslip/withholding employee consoles.
- Scope:
  - `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
  - `src/components/payslip-receipts/request-helpers.ts`
  - `src/components/withholding-receipt/WithholdingReceiptConsole.tsx`
  - `src/components/withholding-receipt/WithholdingReceiptInputPanel.tsx`
  - `src/components/withholding-receipt/useWithholdingReceiptRequests.ts`
  - `scripts/tests/e2e-wi0442-withholding-receipt-copy-runtime-extraction-and-line-budget-300.test.ts`
  - `scripts/tests/e2e-wi0493-payslip-withholding-employee-id-default-restore-and-line-budget.test.ts`
  - `ROADMAP.md`

## Delivery
- Recovered line budgets by refactoring orchestration-only surfaces:
  - `PayslipReceiptConsole.tsx` reduced to <=300 with request helper extraction.
  - `WithholdingReceiptConsole.tsx` reduced to <=300 with input panel and request hook extraction.
- Added locale default restore when employee-id input is emptied (`employeeId.trim().length === 0` -> locale default).
- Kept locale-aware employee-id normalization (`직원-*` UI input vs `EMP-*` API format).
- Updated WI-0442 regression anchor to track extracted request runner location.
- Added WI-0493 regression guard for:
  - both consoles line budget <=300,
  - locale default restore wiring,
  - helper/hook extraction anchors.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0442-withholding-receipt-copy-runtime-extraction-and-line-budget-300.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0439-employee-payslip-receipts-search-filter-and-line-budget-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0471-korean-locale-employee-id-input-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0492-payslips-employee-id-locale-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0493-payslip-withholding-employee-id-default-restore-and-line-budget.test.ts`
- [x] `npm.cmd run typecheck`
