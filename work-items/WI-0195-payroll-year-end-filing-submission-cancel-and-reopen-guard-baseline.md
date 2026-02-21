# WI-0195: Payroll Year-End Filing Submission Cancel and Reopen Guard Baseline

## Background and Problem

WI-0194 added ACK catalog governance, but operators still cannot cancel an in-flight filing submission or reopen a canceled submission with deterministic guard rules.
To continue Phase 4 filing lifecycle hardening, WI-0195 adds cancel/reopen APIs and state-transition guards.

## Scope

### In Scope

- Add cancel/reopen APIs:
  - `POST /payroll/year-end/filing-submissions/{submissionId}/cancel`
  - `POST /payroll/year-end/filing-submissions/{submissionId}/reopen`
- Extend filing submission state model and guards:
  - add `canceled` status
  - allow cancel only from `submitted`
  - allow reopen only from `canceled`
  - reject acknowledge on `canceled` submissions
  - preserve single pending (`submitted`) submission invariant
- Extend filing timeline builder:
  - include `canceled` and `reopened` events in deterministic order
- Extend admin filing console:
  - cancel/reopen submission inputs and actions
  - canceled status rendering and timeline visibility
- Add WI-0195 regression test:
  - `scripts/tests/e2e-wi0195-payroll-year-end-filing-submission-cancel-and-reopen-guard-baseline.test.ts`
- Wire WI-0195 into MVP/FULL e2e chains
- Update payroll specs/docs (contract/api/test-cases/data ownership/roadmap)

### Out of Scope

- Auto-cancel scheduler and inactivity timeout policy
- Reopen approval workflow
- External filing authority recall/reopen synchronization

## User Scenarios

1. Payroll operator cancels a pending filing submission before acknowledgement and confirms status changes to `canceled`.
2. Payroll operator reopens a canceled submission and proceeds with normal acknowledgement.
3. Payroll operator receives deterministic guard errors for invalid transitions (already canceled, acknowledged cancel, non-canceled reopen, canceled acknowledge).

## Data Changes

- New APIs:
  - POST /payroll/year-end/filing-submissions/{submissionId}/cancel
  - POST /payroll/year-end/filing-submissions/{submissionId}/reopen
- Updated model:
  - filing submission summary status adds canceled
  - filing submission timeline adds canceled and reopened actions
- New published events:
  - payroll.year_end.filing_package.canceled.v1
  - payroll.year_end.filing_package.reopened.v1
- DB migration:
  - none (audit/event/service/UI extension only)

## Rollback Plan

- Keep `FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1` off to disable filing submission workflows
- Revert cancel/reopen route/service/schema/UI changes
- Revert WI-0195 tests/spec/doc updates

## Definition of Done (DoD)

- [x] Cancel/reopen APIs exist and enforce deterministic transition guards.
- [x] Filing summary status and timeline include cancel/reopen lifecycle events.
- [x] Canceled submissions are blocked from acknowledgement.
- [x] Admin filing console supports cancel/reopen workflows without page bloat regression.
- [x] WI-0195 e2e exists and is wired into MVP/FULL suites.
