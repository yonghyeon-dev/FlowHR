# WI-0484: Korean Runtime Mixed-Language Suppression (Payslip Receipts)

## Summary
- Goal: prevent mixed runtime diagnostics (`한글 + English`) from leaking raw English text on Korean locale payslip-receipt surface.
- Scope:
  - `src/components/payslip-receipts/runtime-copy-helpers.ts`
  - `scripts/tests/e2e-wi0484-korean-runtime-mixed-language-suppression-payslip-receipts.test.ts`
  - `ROADMAP.md`

## Delivery
- Hardened payslip-receipt runtime normalization order:
  - Apply known Korean pattern mapping first.
  - If message contains both Hangul and Latin tokens and no known mapping exists, return Korean fallback.
  - Preserve pure Korean diagnostics as-is.
- Added dedicated WI-0484 regression test to lock mixed-language suppression behavior and source anchor.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0484-korean-runtime-mixed-language-suppression-payslip-receipts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0462-korean-runtime-message-guard-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0465-korean-runtime-fetch-failure-guard-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0401-korean-copy-residual-sweep-withholding-payslip-contracts.test.ts`
- [x] `npm.cmd run -s typecheck`
