# WI-0529: Payslip Detail Print Verification Section

## Summary
- Goal: improve payslip trust by adding an explicit print verification block in detail view.
- Scope:
  - `src/app/employee/payslips/page-locale-types.ts`
  - `src/app/employee/payslips/page-locale-page-copy.ts`
  - `src/app/employee/payslips/page-view-detail-panel.tsx`
  - `scripts/tests/e2e-wi0529-payslip-detail-print-verification-section.test.ts`
  - `ROADMAP.md`

## Delivery
- Added print verification copy/type keys for `ko`/`en`.
- Added detail panel verification section:
  - expected net (`gross - deduction`)
  - actual payslip net
  - verification result (`balanced`/`mismatch`)
- Kept existing detail panel structure and print sheet flow.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0411-payslips-page-view-section-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0529-payslip-detail-print-verification-section.test.ts`

