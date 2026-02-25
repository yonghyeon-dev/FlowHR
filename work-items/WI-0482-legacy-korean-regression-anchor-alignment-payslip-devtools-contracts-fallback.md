# WI-0482: Legacy Korean Regression Anchor Alignment (Payslip DevTools/Contracts Fallback)

## Summary
- Goal: align stale legacy regression anchors with the current decomposed payslip file layout while preserving Korean/English runtime fallback guarantees.
- Scope:
  - `scripts/tests/e2e-wi0405-payslip-contracts-residual-english-token-cleanup.test.ts`
  - `ROADMAP.md`

## Delivery
- Updated WI-0405 regression test to follow the current payslip decomposition:
  - DevTools session label assertions now target `page-view-filter-panel.tsx`.
  - Locale copy assertions now target `page-locale-page-copy.ts`.
  - Added explicit panel wiring anchor in `page-view.tsx` via `EmployeePayslipFilterPanel` assertion.
- Preserved contracts HTTP fallback guard assertions (`resolveContractsHttpFallbackMessage`, Korean/English fallback copy, `readJson` fallback path).
- Added WI-0482 roadmap entry and version bump to reflect regression-alignment delivery.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0405-payslip-contracts-residual-english-token-cleanup.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.test.ts`
