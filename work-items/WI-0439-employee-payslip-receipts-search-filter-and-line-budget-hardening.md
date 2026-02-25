# WI-0439: Employee Payslip Receipts Search Filter and Line-Budget Hardening

## Summary
- Goal: improve payslip-receipt list discoverability while hardening line-budget discipline.
- Scope:
  - add local search in receipt run list
  - add clear-search action
  - add visible-count and filtered-empty guidance
  - refactor console structure to keep line count <= 300.

## Delivery
- Updated `src/components/payslip-receipts/PayslipReceiptConsole.tsx`
  - added `runsSearchQuery` state and normalized query derivation
  - added `filteredRuns` memo matching run metadata (`id`, `period`, `delivery`, `receipt`)
  - added search input, clear-search action, visible-count indicator, filtered-empty message
  - rewired run list render source from `runs` to `filteredRuns`
  - consolidated response parsing/log append helpers and compacted render flow to recover line budget
  - line count reduced to 284.
- Updated `src/components/payslip-receipts/copy.ts`
  - added ko/en copy keys:
    - `runsSearchLabel`
    - `runsSearchPlaceholder`
    - `clearSearchAction`
    - `visibleRunsLabel`
    - `noFilteredRunsMessage`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0186-payroll-payslip-delivery-receipt-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0427-korean-runtime-residual-hardening-withholding-payslip-receipts-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0439-employee-payslip-receipts-search-filter-and-line-budget-hardening.test.ts`
