# WI-0193: Payroll Year-End Filing Submission Timeline and Evidence Note Baseline

## Background and Problem

WI-0192 added filing resubmission guards, but operators still cannot query submission-level timeline history or attach explicit evidence notes for compliance trace.
To continue Phase 4 filing workflow hardening, WI-0193 adds timeline query and evidence-note append APIs with admin UI support.

## Scope

### In Scope

- Add filing timeline API:
  - `GET /payroll/year-end/filing-submissions/{submissionId}/timeline`
- Add filing evidence-note API:
  - `POST /payroll/year-end/filing-submissions/{submissionId}/evidence-note`
- Extend payroll filing service:
  - deterministic timeline builder from audit actions (`submitted`, `resubmitted`, `acknowledged`, `evidence_note_added`)
  - evidence-note append guard (submission must exist in same employee/year scope)
- Extend admin filing console:
  - timeline target submission input and timeline panel
  - evidence-note input and append action
- Add WI-0193 regression test:
  - `scripts/tests/e2e-wi0193-payroll-year-end-filing-submission-timeline-and-evidence-note-baseline.test.ts`
- Wire WI-0193 into MVP/FULL e2e chains
- Update payroll specs/docs (contract/api/test-cases/data ownership)

### Out of Scope

- Attachment/file upload for filing evidence packages
- External filing gateway reconciliation
- Auto-generated evidence-note policy templates

## User Scenarios

1. Payroll operator opens a submission timeline and verifies submission/resubmission/ack chronology.
2. Payroll operator appends evidence memo on selected submission and confirms timeline includes memo event.
3. Unauthorized actor cannot read timeline or append evidence notes.

## Data Changes

- New APIs:
  - GET /payroll/year-end/filing-submissions/{submissionId}/timeline
  - POST /payroll/year-end/filing-submissions/{submissionId}/evidence-note
- New audit/event actions:
  - payroll.year_end.filing_evidence_note_added
  - payroll.year_end.filing_evidence_note.added.v1
- DB migration:
  - none (audit/event/service/UI extension only)

## Rollback Plan

- Keep `FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1` off to disable filing submission workflows (including timeline/evidence note)
- Revert timeline/evidence-note route/service/schema/UI changes
- Revert WI-0193 tests/spec/doc updates

## Definition of Done (DoD)

- [x] Timeline API returns deterministic ordered events for selected submission.
- [x] Evidence-note API appends auditable note event only for existing submission IDs.
- [x] Admin filing console supports timeline lookup and evidence-note append.
- [x] WI-0193 e2e exists and is wired into MVP/FULL suites.
