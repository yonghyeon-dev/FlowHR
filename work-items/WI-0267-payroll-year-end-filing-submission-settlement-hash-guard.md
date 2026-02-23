# WI-0267: Payroll Year-End Filing Submission Settlement Hash Guard

## Background

WI-0266 added settlement-hash guard for filing export, but filing submit/resubmit
calls could still proceed without explicit finalized-snapshot expectation.
Submission tracking payloads also lacked settlement-hash trace linkage.

## Scope

### In Scope

- filing submit/resubmit stale-request guard
  - support optional `expectedSettlementHash` on:
    - `POST /payroll/year-end/filing-submissions`
    - `POST /payroll/year-end/filing-submissions/{submissionId}/resubmit`
  - reject with `409` when provided hash mismatches latest finalized settlement hash
- submission payload traceability
  - persist and return `settlementHash` in submission/resubmission summary payloads
  - keep list/search/timeline compatibility with legacy logs (hash may be null on old records)
- admin filing console update
  - apply expected settlement hash guard value to submit/resubmit actions
  - show settlement hash trace in submission list rows
- spec/contract/test-cases update and contract version bump (`1.47.0`)
- WI-0267 regression e2e
  - `scripts/tests/e2e-wi0267-payroll-year-end-filing-submission-settlement-hash-guard.test.ts`

### Out of Scope

- year-end settlement formula changes
- filing ACK catalog/policy changes
- scheduler/ops automation expansion

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0267-payroll-year-end-filing-submission-settlement-hash-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0266-payroll-year-end-export-settlement-hash-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0191-payroll-year-end-filing-submission-tracking-and-ack-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0192-payroll-year-end-filing-resubmission-and-state-transition-guard-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
