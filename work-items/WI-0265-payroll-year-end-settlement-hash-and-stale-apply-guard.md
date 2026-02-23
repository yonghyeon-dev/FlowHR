# WI-0265: Payroll Year-End Settlement Hash and Stale Apply Guard

## Background

Year-end finalization `apply=true` calls had no deterministic stale-request guard.
Operators could preview one snapshot and accidentally apply a changed snapshot
without explicit mismatch feedback.

## Scope

### In Scope

- settlement hash model for finalization payloads
  - add deterministic `settlementHash` to finalize preview/apply responses
  - hash input includes year/employee, run state summary, annual totals,
    deduction eligibility, deduction summary, and settlement summary
- stale apply guard
  - add optional `expectedSettlementHash` input on finalize API
  - when `apply=true` and expected hash mismatches computed hash, reject with 409
    and return expected/computed hash values
- schema update
  - validate `expectedSettlementHash` as sha256 hex (64 chars)
- spec/contract/test-cases update and contract version bump (`1.45.0`)
- WI-0265 regression e2e
  - `scripts/tests/e2e-wi0265-payroll-year-end-settlement-hash-and-stale-apply-guard.test.ts`

### Out of Scope

- filing export artifact hash changes
- deduction cap/tax-credit cap model changes
- additional UI flows on `/admin/payroll-year-end`

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0265-payroll-year-end-settlement-hash-and-stale-apply-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0264-payroll-year-end-withholding-delta-breakdown-ux.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
