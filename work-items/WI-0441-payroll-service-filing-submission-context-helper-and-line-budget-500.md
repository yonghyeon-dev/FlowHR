# WI-0441: Payroll Service Filing Submission Context Helper and Line-Budget 500

## Summary
- Goal: continue payroll service bloat control while preserving filing submission behavior.
- Scope:
  - extract duplicated filing submission precondition flow to a shared helper
  - remove stale/unused import surface from `service.ts`
  - enforce `service.ts` line budget <= 500.

## Delivery
- Updated `src/features/payroll/service.ts`
  - removed unused imports from adapter/runtime/input/output helper groups
  - added `loadFilingSubmissionContext(context, year, employeeId)` to centralize:
    - year-end filing feature flag checks
    - year-end run snapshot load
    - filing submission summary load
  - rewired both
    - `submitPayrollYearEndFilingPackage`
    - `resubmitPayrollYearEndFilingPackage`
    to use the shared helper
  - preserved existing submission creation flow via `createYearEndFilingSubmissionFromHelper`
  - reduced line count: 546 -> 486.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0309-payroll-service-modular-split-phase8-runtime-helpers.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0317-payroll-service-modular-split-phase12-input-types.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0321-payroll-service-output-type-split-phase13.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0359-payroll-service-modular-split-phase21-filing-submission-creation-helper.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0380-payroll-service-modular-split-phase29-filing-query-evidence-helpers.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0441-payroll-service-filing-submission-context-helper-and-line-budget-500.test.ts`
