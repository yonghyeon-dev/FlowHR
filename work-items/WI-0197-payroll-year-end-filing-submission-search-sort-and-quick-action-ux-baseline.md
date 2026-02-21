# WI-0197: Payroll Year-End Filing Submission Search/Sort and Quick Action UX Baseline

## Background and Problem

WI-0196 introduced summary and filter controls for filing submissions, but operators still lack query-time search/sort controls and row-level quick actions.
This causes repetitive manual input when triaging rejected/canceled submissions and slows daily filing operations.

## Scope

### In Scope

- Extend filing submission list query:
  - optional `search` keyword (submission/ack/note fields)
  - optional `sortBy` (`submittedAt`, `attempt`, `status`, `ackStatus`, `validationStatus`, `transport`)
  - optional `sortDirection` (`asc`, `desc`)
- Extend filing submission list service:
  - deterministic search matching over submission, ack, and note metadata
  - deterministic sort with explicit tie-break fallback
- Extend admin filing console:
  - submission search input + sort controls
  - row-level quick actions (`Quick ACK Accepted`, `Quick Cancel`, `Quick Reopen`, `Quick Resubmit`, timeline jump)
- Add WI-0197 regression test:
  - `scripts/tests/e2e-wi0197-payroll-year-end-filing-submission-search-sort-and-quick-action-ux-baseline.test.ts`
- Wire WI-0197 into MVP/FULL e2e chains
- Update payroll specs/docs (contract/api/test-cases/roadmap/work-item)

### Out of Scope

- Server-side pagination/cursor continuation
- Bulk multi-row action execution
- Saved operator-specific search presets

## User Scenarios

1. Payroll operator searches by ACK code or submission note to immediately locate rejected items.
2. Payroll operator sorts by attempt/status/ackStatus to prioritize retries and triage.
3. Payroll operator uses row-level quick actions to acknowledge, cancel, reopen, or resubmit without re-entering submission IDs.

## Data Changes

- Updated API:
  - GET /payroll/year-end/filing-submissions query adds search, sortBy, and sortDirection fields
- Updated behavior:
  - filing submission list now applies deterministic search+sort after existing filters
- DB migration:
  - none (service/query/UI extension only)

## Rollback Plan

- Keep `FLOWHR_PAYROLL_YEAR_END_FILING_SUBMISSION_V1` off to disable filing submission workflows
- Revert filing submission list schema/service/route/UI search/sort/quick-action changes
- Revert WI-0197 tests/spec/doc updates

## Definition of Done (DoD)

- [x] Filing submission list API supports deterministic search/sort query behavior.
- [x] Admin filing console exposes search/sort controls and row-level quick actions.
- [x] Search/sort and quick-action behavior remains permission-guarded and feature-flag aware.
- [x] WI-0197 e2e exists and is wired into MVP/FULL suites.
- [x] Contract/API/test-cases/roadmap/work-item docs are synced.
