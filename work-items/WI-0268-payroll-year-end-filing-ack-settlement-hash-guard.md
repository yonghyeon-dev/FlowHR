# WI-0268: Payroll Year-End Filing ACK Settlement Hash Guard

## Background

WI-0267 added settlement-hash guard for submit/resubmit, but ACK requests could
still acknowledge a submission without explicit snapshot expectation. Operators
needed ACK-time hash validation to prevent acknowledging the wrong submission
snapshot context.

## Scope

### In Scope

- filing acknowledgement stale-request guard
  - support optional `expectedSettlementHash` on:
    - `POST /payroll/year-end/filing-submissions/{submissionId}/ack`
  - reject with `409` when provided hash mismatches target submission hash
- acknowledgement audit trace hardening
  - store `settlementHash` and `expectedSettlementHash` in ACK audit payload
  - keep legacy compatibility for submissions without stored hash
- admin filing console update
  - expose optional expected settlement hash input for ACK guard
- spec/contract/test-cases update and contract version bump (`1.48.0`)
- WI-0268 regression e2e
  - `scripts/tests/e2e-wi0268-payroll-year-end-filing-ack-settlement-hash-guard.test.ts`

### Out of Scope

- filing list/search/filter model changes
- year-end settlement formula or cap logic changes
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0268-payroll-year-end-filing-ack-settlement-hash-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0267-payroll-year-end-filing-submission-settlement-hash-guard.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
