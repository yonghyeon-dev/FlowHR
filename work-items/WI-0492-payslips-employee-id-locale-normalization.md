# WI-0492: Payslips Employee ID Locale Normalization

## Summary
- Goal: remove residual English employee-id exposure in Korean payslips runtime by separating UI input/display locale from API id format.
- Scope:
  - `src/app/employee/payslips/page.tsx`
  - `src/app/employee/payslips/use-payslip-api.ts`
  - `src/app/employee/payslips/use-payslip-derived-state.ts`
  - `src/app/employee/payslips/page-view-detail-panel.tsx`
  - `scripts/tests/e2e-wi0492-payslips-employee-id-locale-normalization.test.ts`
  - `ROADMAP.md`

## Delivery
- Applied locale-aware employee id defaults in payslips page (`직원-1001` for ko, `EMP-1001` for en).
- Normalized payslips API calls to always use `EMP-*` format through `normalizeEmployeeIdForApi(...)`.
- Localized payslip employee-id display and filename labels through `formatEmployeeIdForLocaleDisplay(...)`.
- Added locale input normalization so ko runtime keeps `직원-*` style in visible input while preserving API compatibility.
- Added WI-0492 regression guard for locale helper wiring and Korean employee-id normalization behavior.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0492-payslips-employee-id-locale-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0487-korean-surface-english-suppression-withholding-payslips-contracts.test.ts`
- [x] `npm.cmd run typecheck`
