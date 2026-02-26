# WI-0526: Korean Residual Sweep (Withholding/Payslip/Contracts) One-Shot

## Summary
- Goal: remove remaining Korean-surface English leakage in key employee finance/contract journeys with a single sweep.
- Scope:
  - `src/app/employee/payslips/page-helpers.ts`
  - `src/app/employee/payslips/page-view-filter-panel.tsx`
  - `src/app/employee/payslips/page-view-detail-panel.tsx`
  - `src/app/employee/payslips/page-view.tsx`
  - `scripts/tests/e2e-wi0487-korean-surface-english-suppression-withholding-payslips-contracts.test.ts`
  - `scripts/tests/e2e-wi0526-korean-residual-sweep-withholding-payslip-contracts-one-shot.test.ts`
  - `ROADMAP.md`

## Delivery
- Payslip attendance hour formatting is now locale-aware:
  - `ko`: `8.0시간`
  - `en`: `8.0h`
- Wired `isKoLocale` into payslip filter/detail panels so Korean pages no longer render `h` suffix.
- Aligned legacy contracts Korean-surface regression test (`WI-0487`) with current split structure
  (`EmployeeContractsInbox` + `EmployeeContractsResponsePanel`).
- Added one-shot regression guard test (`WI-0526`) to prevent future Korean-surface English residual regressions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0487-korean-surface-english-suppression-withholding-payslips-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0526-korean-residual-sweep-withholding-payslip-contracts-one-shot.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd run typecheck`
