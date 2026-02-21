# WI-0196: Payroll Year-End Filing Submission Status Summary and Filter UX Baseline

## Background and Problem

WI-0195 completed cancel/reopen transition guards, but operators still need to manually scan full submission lists without deterministic summary counters or query-level filters.
To improve day-to-day filing operations, WI-0196 adds submission status summary and filter workflow.

## Scope

### In Scope

- Extend filing submission list query:
  - optional status filter (submitted, acknowledged, canceled, all)
  - optional ackStatus filter (accepted, rejected, none, all)
  - optional validationStatus filter (pass, fail, all)
  - optional transport filter (manual_portal, hometax_upload, nts_api_mock, all)
- Extend filing submission list response:
  - summary counters (total/filtered, status, ack status, validation status, transport)
- Extend admin filing console:
  - filter selectors for status/ackStatus/validationStatus/transport
  - summary KPI section + active filter visibility
  - refresh with filter-aware query
- Add WI-0196 regression test:
  - scripts/tests/e2e-wi0196-payroll-year-end-filing-submission-status-summary-and-filter-ux-baseline.test.ts
- Wire WI-0196 into MVP/FULL e2e chains
- Update payroll specs/docs (contract/api/test-cases/roadmap/work-item)

### Out of Scope

- Server-side pagination and cursor continuation
- Saved filter presets per operator
- Cross-employee or organization-wide filing queue aggregation endpoint

## User Scenarios

1. Payroll operator filters filing submissions by canceled status to focus only on unresolved canceled attempts.
2. Payroll operator filters by ACK rejected to review only rejected outcomes.
3. Payroll operator uses summary counters to compare filtered results against total submission history for the selected employee/year.

## Data Changes

- Updated API:
  - GET /payroll/year-end/filing-submissions query adds status, ackStatus, validationStatus, transport filters
- Updated response:
  - filing submission list response includes summary counters and filteredCount
- DB migration:
  - none (service/query/UI extension only)

## Rollback Plan

- Keep FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1 off to disable filing submission workflows
- Revert filing submission list schema/service/route/UI summary-filter changes
- Revert WI-0196 tests/spec/doc updates

## Definition of Done (DoD)

- [x] Filing submission list API supports deterministic filters and summary counters.
- [x] Admin filing console supports summary KPI rendering and filter-aware refresh.
- [x] Filter behavior is permission-guarded and feature-flag aware.
- [x] WI-0196 e2e exists and is wired into MVP/FULL suites.
- [x] Contract/API/test-cases/roadmap/work-item docs are synced.
