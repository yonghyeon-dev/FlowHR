# WI-0504: Runtime Line-Budget Recovery for Withholding and Contracts

## Summary
- Goal: recover core runtime line-budget guard stability by reducing overflow in withholding and contracts runtime helpers.
- Scope:
  - `src/components/withholding-receipt/copy-runtime.ts`
  - `src/components/contracts/http.ts`
  - `scripts/tests/e2e-wi0504-runtime-line-budget-recovery-withholding-contracts.test.ts`
  - `ROADMAP.md`

## Delivery
- Reduced `withholding-receipt/copy-runtime.ts` line count:
  - 407 -> 344
- Reduced `contracts/http.ts` line count:
  - 231 -> 211
- Kept existing runtime behavior and export signatures while compacting helper logic.
- Restored `e2e-wi0466` line-budget gate pass for both files.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0466-core-line-budget-guard-phase3-scheduling-leave-runtime.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0489-contracts-http-fallback-runtime-alignment.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0504-runtime-line-budget-recovery-withholding-contracts.test.ts`
- [x] `npm.cmd run typecheck`
