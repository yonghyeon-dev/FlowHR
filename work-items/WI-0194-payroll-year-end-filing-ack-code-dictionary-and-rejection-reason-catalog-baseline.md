# WI-0194: Payroll Year-End Filing ACK Code Dictionary and Rejection Reason Catalog Baseline

## Background and Problem

WI-0193 added filing timeline/evidence-note traceability, but acknowledgement inputs still rely on free-form ACK codes and notes.
To keep filing acknowledgement deterministic, WI-0194 adds ACK code dictionary and rejection reason catalog workflow.

## Scope

### In Scope

- Add filing ACK catalog API:
  - GET /payroll/year-end/filing-ack-catalog
- Extend filing acknowledgement guard:
  - ACK code must match ackStatus-specific dictionary
  - rejectionReasonCode (when provided) must match rejection reason catalog
  - rejection reason fields are rejected for accepted ACK status
- Extend admin filing console:
  - load ACK catalog action
  - ACK code select and rejection reason select/detail inputs
- Add WI-0194 regression test:
  - scripts/tests/e2e-wi0194-payroll-year-end-filing-ack-code-dictionary-and-rejection-reason-catalog-baseline.test.ts
- Wire WI-0194 into MVP/FULL e2e chains
- Update payroll specs/docs (contract/api/test-cases/roadmap/work-item)

### Out of Scope

- External authority ACK code synchronization
- Localization workflow for ACK/reason labels
- Rule engine for organization-specific ACK catalog customization

## User Scenarios

1. Payroll operator loads ACK catalog and chooses valid ACK code for accepted/rejected acknowledgement.
2. Payroll operator receives deterministic validation error when ACK code does not match selected ackStatus.
3. Payroll operator captures rejected acknowledgement reason using catalog-based reason code and optional detail.

## Data Changes

- New API:
  - GET /payroll/year-end/filing-ack-catalog
- Updated payload:
  - filing acknowledgement request/summary includes rejectionReasonCode and rejectionReasonDetail
- DB migration:
  - none (catalog/service/UI extension only)

## Rollback Plan

- Keep FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 off to disable filing submission workflows (including ACK catalog path)
- Revert ACK catalog route/service/schema/UI changes
- Revert WI-0194 tests/spec/doc updates

## Definition of Done (DoD)

- [x] ACK catalog API is available and permission-guarded.
- [x] Filing acknowledgement validates ACK code/rejection reason against catalog deterministically.
- [x] Admin filing console supports ACK catalog loading and catalog-based acknowledgement input.
- [x] WI-0194 e2e exists and is wired into MVP/FULL suites.
