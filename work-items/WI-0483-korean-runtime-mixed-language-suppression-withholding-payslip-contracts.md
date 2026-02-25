# WI-0483: Korean Runtime Mixed-Language Suppression (Withholding/Payslip/Contracts)

## Summary
- Goal: prevent mixed runtime diagnostics (`한글 + English`) from leaking raw English text on Korean locale surfaces.
- Scope:
  - `src/app/employee/payslips/page-locale-runtime.ts`
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `src/components/contracts/http.ts`
  - `scripts/tests/e2e-wi0483-korean-runtime-mixed-language-suppression-withholding-payslip-contracts.test.ts`
  - `ROADMAP.md`

## Delivery
- Hardened Korean runtime normalization order for payslip and withholding:
  - Apply known Korean pattern mapping first.
  - If message contains both Hangul and Latin tokens and no known mapping exists, return Korean fallback instead of raw mixed text.
  - Preserve pure Korean diagnostics as-is.
- Hardened contracts runtime error normalization with the same mixed-language suppression rule:
  - Known mappings keep specific Korean messages.
  - Unmapped mixed strings now fall back to Korean fallback message.
- Added WI-0483 regression test to lock behavior across all three surfaces.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0483-korean-runtime-mixed-language-suppression-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0481-korean-copy-residual-runtime-hardening-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd run -s typecheck`
