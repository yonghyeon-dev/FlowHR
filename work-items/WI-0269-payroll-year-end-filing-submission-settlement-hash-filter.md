# WI-0269: Payroll Year-End Filing Submission Settlement Hash Filter

## Background

After WI-0265~0268, settlement hash trace existed across finalization/export/
submission/ack flows, but list query lacked direct settlement-hash filtering.
Operators needed deterministic filtering and quick hash chips in admin UI to
investigate submission history by snapshot.

## Scope

### In Scope

- filing submission list query filter extension
  - add optional `settlementHash` query parameter on:
    - `GET /payroll/year-end/filing-submissions`
  - support 8~64 hex prefix matching against submission `settlementHash`
- service filter model update
  - include settlement-hash filter in deterministic list/search/sort path
  - keep legacy compatibility for old records with null hash
- admin filing console update
  - add settlement-hash filter input
  - add quick filter chips from current submission hash trace
  - expose active filter summary with settlement hash filter value
- spec/contract/test-cases update and contract version bump (`1.49.0`)
- WI-0269 regression e2e
  - `scripts/tests/e2e-wi0269-payroll-year-end-filing-submission-settlement-hash-filter.test.ts`

### Out of Scope

- new submission status model or queue metrics redesign
- year-end settlement formula/cap/eligibility changes
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0269-payroll-year-end-filing-submission-settlement-hash-filter.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0268-payroll-year-end-filing-ack-settlement-hash-guard.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
