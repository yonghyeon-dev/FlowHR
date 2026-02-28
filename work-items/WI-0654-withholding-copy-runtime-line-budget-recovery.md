# WI-0654 Withholding Copy Runtime Line-Budget Recovery

## Summary
- recovered line budget regression in `src/components/withholding-receipt/copy-runtime.ts`.
- reduced file size from 382 to 379 lines to satisfy existing guard threshold (`<= 380`).
- kept runtime behavior and copy keys unchanged.
- added dedicated WI-0654 regression test to lock the line budget and core helper export surface.

## Scope
- withholding receipt runtime copy module maintenance only
- no API/schema/contract changes
- no behavior changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0654-withholding-copy-runtime-line-budget-recovery.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0596-korean-residual-bugpack-withholding-payslips-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0593-withholding-receipt-validation-summary.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0617-korean-runtime-guard-withholding-payslip-contracts.test.ts`
- `npm.cmd run typecheck`
