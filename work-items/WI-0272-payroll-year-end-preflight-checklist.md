# WI-0272: Payroll Year-End Preflight Checklist

## Background

Operators could manually infer finalization readiness from multiple screens, but
there was no single preflight checklist that aggregates run-state, distribution,
receipt, filing-submission, non-taxable guard, and settlement-hash trace before
year-end finalization.

## Scope

### In Scope

- preflight checklist API
  - add `GET /payroll/year-end/preflight-checklist`
  - support optional `nonTaxableAnnualIncomeKrw` query for upper-bound guard preview
  - return deterministic checklist:
    - run/distribution/receipt guards
    - pending filing submission guard
    - non-taxable annual income guard
    - settlement hash availability trace
    - ready-to-finalize summary (`pass`/`fail`/`warn` counts)
- admin preflight screen
  - add `/admin/payroll-year-end/preflight`
  - add checklist input/summary/check rows and API log panel
  - link from `/admin/payroll-year-end`
- spec/contract/test-cases update and contract version bump (`1.52.0`)
- WI-0272 regression e2e
  - `scripts/tests/e2e-wi0272-payroll-year-end-preflight-checklist.test.ts`

### Out of Scope

- finalization formula/cap policy changes
- filing transition workflow changes
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0272-payroll-year-end-preflight-checklist.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0271-payroll-year-end-insurance-reconciliation-report.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
