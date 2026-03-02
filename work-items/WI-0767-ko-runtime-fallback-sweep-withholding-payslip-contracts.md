# WI-0767 KO Runtime Fallback Sweep (Withholding/Payslip/Contracts)

## Summary
- fixed a remaining Korean runtime fallback gap in employee payslip filename generation:
  - `src/app/employee/payslips/use-payslip-derived-state.ts`
  - invalid period year fallback now uses `미확인` in `ko` locale (instead of English `unknown`)
- added a focused KO runtime regression guard for withholding/payslip/contracts:
  - `scripts/tests/e2e-wi0767-ko-runtime-fallback-sweep-withholding-payslip-contracts.test.ts`
  - verifies Korean fallback behavior for:
    - payslip runtime diagnostic normalization
    - withholding runtime diagnostic/activity label normalization
    - contracts title/evidence filename normalization
  - locks payslip filename year fallback copy to locale-aware behavior

## Scope
- Korean runtime fallback bug-fix and guard only
- no scheduler/ops/devtools expansion
- no phase-style i18n layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0767-ko-runtime-fallback-sweep-withholding-payslip-contracts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0708-ko-runtime-fallback-normalization-for-contracts-withholding.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0713-ko-runtime-copy-guard-finance-contracts.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
