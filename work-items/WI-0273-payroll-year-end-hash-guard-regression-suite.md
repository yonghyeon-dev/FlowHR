# WI-0273: Payroll Year-End Hash Guard Regression Suite

## Background

Hash guard coverage for WI-0265~0269 existed as separate e2e files, but review
and regression triage still required multiple independent test runs. A unified
suite was needed to catch cross-step regressions in one deterministic flow.

## Scope

### In Scope

- unified hash-guard regression e2e
  - add `scripts/tests/e2e-wi0273-payroll-year-end-hash-guard-regression-suite.test.ts`
  - single replay scenario covers:
    - finalize preview/apply hash guard (`WI-0265`)
    - export hash guard (`WI-0266`)
    - submit/resubmit hash guard (`WI-0267`)
    - ACK hash guard (`WI-0268`)
    - submission list settlement-hash filter (`WI-0269`)
- spec/contract/test-cases update and contract version bump (`1.53.0`)

### Out of Scope

- runtime API/DB behavior changes
- new hash algorithms or key model changes
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0273-payroll-year-end-hash-guard-regression-suite.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0265-payroll-year-end-settlement-hash-and-stale-apply-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0269-payroll-year-end-filing-submission-settlement-hash-filter.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
