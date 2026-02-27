# WI-0596: Korean Residual Bugpack (Withholding/Payslips/Contracts Inbox)

## Summary
- Goal: remove remaining Korean-surface English residue risk in key employee journeys.
- Scope:
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `src/components/withholding-receipt/runtime-label-helpers.ts`
  - `src/components/withholding-receipt/WithholdingReceiptPanels.tsx`
  - `src/components/contracts/EmployeeContractsInbox.tsx`
  - `src/components/contracts/EmployeeContractsInboxList.tsx`
  - `src/app/employee/payslips/page-view-run-list-panel.tsx`
  - `scripts/tests/e2e-wi0596-korean-residual-bugpack-withholding-payslips-contracts.test.ts`
  - `ROADMAP.md`

## Delivery
- Added withholding runtime activity label normalizer (`normalizeWithholdingActivityLabel`) for ko locale.
  - covers pending label and API log label rendering fallback in `WithholdingLogsPanel`.
- Added contracts inbox list status fallback labels for unknown states in ko locale.
  - document status fallback: `알 수 없는 상태`
  - approval status fallback: `알 수 없는 승인 상태`
- Removed unused contracts inbox import to keep lint baseline stable.
- Standardized payslip run-list summary separators to ASCII `/` to avoid locale/font rendering artifacts.
- Added WI-0596 regression test to lock the above behavior.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0596-korean-residual-bugpack-withholding-payslips-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0526-korean-residual-sweep-withholding-payslip-contracts-one-shot.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0553-withholding-receipt-document-metadata-copy-action.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0504-runtime-line-budget-recovery-withholding-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0502-employee-contracts-inbox-status-filter-and-pending-count.test.ts`
- [x] `npm.cmd run lint`
- [x] `npm.cmd run typecheck`
