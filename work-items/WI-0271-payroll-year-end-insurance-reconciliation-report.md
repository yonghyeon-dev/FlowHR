# WI-0271: Payroll Year-End Insurance Reconciliation Report

## Background

FlowHR had year-end settlement and 4-insurance calculation surfaces, but lacked
a direct report that compares confirmed-run social-insurance totals against
finalized year-end insurance-premium deduction trace in one place.

## Scope

### In Scope

- insurance reconciliation report API
  - add `GET /payroll/year-end/insurance-reconciliation-report`
  - include:
    - annual run social-insurance baseline
    - latest finalized insurance-premium deduction trace and settlement hash
    - reconciliation delta/status (`matched`/`mismatch`/`pending_finalization`)
    - monthly breakdown (run/social-insurance/withholding aggregates)
- admin year-end console update
  - add report loading action
  - add insurance reconciliation summary panel
- spec/contract/test-cases update and contract version bump (`1.51.0`)
- WI-0271 regression e2e
  - `scripts/tests/e2e-wi0271-payroll-year-end-insurance-reconciliation-report.test.ts`

### Out of Scope

- 4-insurance formula/rate policy changes
- external filing/remittance integration
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0271-payroll-year-end-insurance-reconciliation-report.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0270-payroll-year-end-application-reason-code-explainability.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
