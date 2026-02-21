# WI-0191: Payroll Year-End Filing Submission Tracking and ACK Baseline

## Background and Problem

WI-0190 provides multi-format export and validation for year-end filing artifacts, but payroll operators still cannot track submission lifecycle and acknowledgement status.
To continue Phase 4 compliance flow, WI-0191 adds filing submission tracking and ACK workflow.

## Scope

### In Scope

- Add filing submission APIs:
  - `GET /payroll/year-end/filing-submissions`
  - `POST /payroll/year-end/filing-submissions`
  - `POST /payroll/year-end/filing-submissions/{submissionId}/ack`
- Add payroll service logic:
  - feature flag gate (`FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1`)
  - submission summary construction using latest finalized/exported artifact metadata
  - acknowledgement state transition (`submitted` -> `acknowledged`)
  - deterministic submission tracking reconstruction from audit logs
- Extend admin filing console:
  - submit transport selector (`manual_portal`/`hometax_upload`/`nts_api_mock`)
  - ack input (submissionId/status/code/note)
  - submission list panel
- Add WI-0191 regression test:
  - `scripts/tests/e2e-wi0191-payroll-year-end-filing-submission-tracking-and-ack-baseline.test.ts`
- Wire WI-0191 into MVP/FULL e2e chains
- Update payroll specs (contract/api/test-cases/data ownership)

### Out of Scope

- Real government filing API integration
- Retransmission scheduler and exponential backoff policy
- Digital signature and legal archive retention workflow

## User Scenarios

1. Payroll operator submits finalized filing package and receives deterministic submission ID with artifact checksum metadata.
2. Payroll operator lists submission history for selected employee/year.
3. Payroll operator records ACK outcome (`accepted`/`rejected`) for submitted package and blocks duplicate ACK.

## Data Changes

- New APIs:
  - GET /payroll/year-end/filing-submissions
  - POST /payroll/year-end/filing-submissions
  - POST /payroll/year-end/filing-submissions/{submissionId}/ack
- Updated model:
  - `PayrollRun` (read-only source; tracking materialized from audit logs)
- DB migration:
  - none (audit/event/service/UI extension only)

## Rollback Plan

- Disable `FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1`
- Revert filing submission routes/service/schema/UI changes
- Revert WI-0191 tests/spec/doc updates

## Definition of Done (DoD)

- [x] Filing submission create/list/ack APIs work with permission/flag guards.
- [x] ACK is blocked for unknown/already-acknowledged submission IDs.
- [x] Admin filing console supports submit/ack/list workflow.
- [x] Payroll contract/api/test-cases and ownership/events include submission tracking baseline.
- [x] WI-0191 regression test exists and is wired into MVP/FULL suites.
