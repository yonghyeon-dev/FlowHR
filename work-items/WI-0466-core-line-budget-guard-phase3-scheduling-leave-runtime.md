# WI-0466: Core Line-Budget Guard Phase3 (Scheduling/Leave/Runtime)

## Summary
- Goal: Lock in recently recovered line budgets so service/helper files do not regress.
- Scope:
  - Add tightened line-budget regression guard for scheduling and leave domains.
  - Include runtime Korean-normalizer modules in guard coverage.
  - Keep behavior unchanged.

## Delivery
- Added `scripts/tests/e2e-wi0466-core-line-budget-guard-phase3-scheduling-leave-runtime.test.ts`
  - `src/features/scheduling/service.ts` <= 4800
  - `src/features/scheduling/incident-read-model-helpers.ts` <= 360
  - `src/features/leave/service.ts` <= 2600
  - `src/features/leave/policy-time-helpers.ts` <= 280
  - `src/components/payslip-receipts/runtime-copy-helpers.ts` <= 140
  - `src/components/withholding-receipt/copy-runtime.ts` <= 380
  - `src/components/contracts/http.ts` <= 220
- Added decomposition wiring assertions:
  - scheduling service imports incident read-model helpers
  - leave service imports policy/time helpers

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0466-core-line-budget-guard-phase3-scheduling-leave-runtime.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0463-scheduling-incident-read-model-helper-extraction-line-budget-4800.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0464-leave-policy-time-helper-extraction-line-budget-2600.test.ts`
