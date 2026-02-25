# WI-0405: Payslip/Contracts Residual English Token Cleanup

## Summary
- Goal: remove residual English-only runtime tokens from Korean surfaces in payslip and contracts flows.
- Change:
  - Replaced hardcoded `role=`, `org=`, `actor=` session labels in `payslips/page-view.tsx` with locale copy keys.
  - Extended `payslips/page-locale-helpers.ts` devtools copy contract with role/organization/actor labels for both `ko` and `en`.
  - Added locale-aware default fallback in `contracts/http.ts` so missing fallback messages no longer default to English in Korean runtime.
  - Updated existing regression (`WI-0395`) and added dedicated regression (`WI-0405`) for residual English token cleanup.
- Outcome:
  - Korean runtime no longer leaks `role/org/actor` hardcoded English tokens in payslip devtools session line.
  - Contracts fallback error copy now follows runtime locale.

## Scope
- `src/app/employee/payslips/page-view.tsx`
- `src/app/employee/payslips/page-locale-helpers.ts`
- `src/components/contracts/http.ts`
- `scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- `scripts/tests/e2e-wi0405-payslip-contracts-residual-english-token-cleanup.test.ts`
- `work-items/WI-0405-payslip-contracts-residual-english-token-cleanup.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0395-contracts-korean-copy-and-error-fallback.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0405-payslip-contracts-residual-english-token-cleanup.test.ts`
- `npm.cmd run build`
