# WI-0192: Payroll Year-End Filing Resubmission and State Transition Guard Baseline

## Background and Problem

WI-0191 introduced filing submission tracking and acknowledgement, but there is no dedicated resubmission path and submission-state transition guard for rejected filings.
To continue Phase 4 compliance flow, WI-0192 adds resubmission workflow and transition guards.

## Scope

### In Scope

- Add resubmission API:
  - `POST /payroll/year-end/filing-submissions/{submissionId}/resubmit`
- Extend filing submission state machine guards:
  - allow at most one pending (`submitted`) submission per employee/year
  - allow resubmission only from `acknowledged + rejected`
  - reject duplicate resubmission from same source submission
- Extend submission summary model:
  - attempt number (`attempt`)
  - parent link (`resubmissionOfSubmissionId`)
  - resubmission reason (`resubmissionReason`)
- Extend admin filing console:
  - resubmit target input and reason field
  - submission list includes attempt/parent/ack state
- Add WI-0192 regression test:
  - `scripts/tests/e2e-wi0192-payroll-year-end-filing-resubmission-and-state-transition-guard-baseline.test.ts`
- Wire WI-0192 into MVP/FULL e2e chains
- Update payroll specs/docs (contract/api/test-cases/data ownership)

### Out of Scope

- Auto-resubmission scheduler and retry backoff policy
- External filing gateway integration
- Legal archive workflow for attachments/signatures

## User Scenarios

1. Payroll operator cannot create a new submission while another submission is pending ACK.
2. Payroll operator can resubmit only after ACK result is `rejected`.
3. Payroll operator can trace attempt numbers and parent-child submission linkage in submission history.

## Data Changes

- New API:
  - POST /payroll/year-end/filing-submissions/{submissionId}/resubmit
- Updated model:
  - Filing submission summary (audit-derived) with attempt and parent link
- DB migration:
  - none (audit/event/service/UI extension only)

## Rollback Plan

- Keep `FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1` off to disable filing submission workflows
- Revert resubmit route/service/schema/UI changes
- Revert WI-0192 tests/spec/doc updates

## Definition of Done (DoD)

- [x] Resubmission API exists and enforces rejected-only transition.
- [x] Pending/duplicate resubmission transition guards are enforced deterministically.
- [x] Submission summaries include attempt and parent-link metadata.
- [x] Admin filing console supports resubmission workflow with visible transition context.
- [x] WI-0192 e2e exists and is wired into MVP/FULL suites.
