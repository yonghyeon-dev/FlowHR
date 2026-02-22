> **DEPRECATED**: This WI deliverable was consolidated by filing-ops de-bloat cleanup (WI-0218).
> Reference: docs/codex-guide.md Part 1.5
# WI-0198: Payroll Year-End Filing Ops Dashboard Split and Evidence/Status Summary Cards Baseline

## Background and Problem

WI-0189~WI-0197 accumulated finalization/export/submission/ack/timeline features into one execution console (`/admin/payroll-year-end-filing`).
Operational monitoring (queue triage + evidence coverage checks) and execution actions now coexist in a single page, making daily monitoring noisy and hard to scan.

Following `docs/codex-guide.md`, WI-0198 splits monitoring concerns into a dedicated route instead of adding more sections to the existing page.

## Scope

### In Scope

- Add dedicated filing ops route:
  - `GET /admin/payroll-year-end-filing/ops` (UI route)
  - component: `PayrollYearEndFilingOpsDashboard`
- Keep existing execution console (`/admin/payroll-year-end-filing`) intact and add cross-link to the new ops dashboard.
- Add status summary cards baseline driven by filing list summary:
  - total/filtered/submitted/ack-rejected/validation-fail/canceled
- Add evidence summary cards baseline driven by submission metadata + timeline evidence events:
  - submission-note/ack-note/timeline-evidence coverage
  - evidence-gap rows and missing rejection-detail counts
- Reuse existing APIs only:
  - `GET /payroll/year-end/filing-submissions`
  - `GET /payroll/year-end/filing-submissions/{submissionId}/timeline`
- Add WI-0198 regression test:
  - `scripts/tests/e2e-wi0198-payroll-year-end-filing-ops-dashboard-split-and-evidence-status-summary-cards-baseline.test.ts`
- Wire WI-0198 into MVP/FULL e2e chains.
- Update payroll specs/docs (contract/api/test-cases/roadmap/work-item) to reflect ops-dashboard split baseline.

### Out of Scope

- New filing API endpoints
- Scheduler/cron/background automation
- Multi-employee aggregate dashboard or pagination redesign
- Additional webhook/email delivery channels

## User Scenarios

1. Payroll operator opens a dedicated ops dashboard to monitor filing queue health without opening execution-heavy controls first.
2. Payroll operator reviews status cards to triage pending/rejected/failing submissions quickly.
3. Payroll operator reviews evidence cards to detect missing notes/rejection details and jump back to execution console for action.

## Data and API Changes

- No DB migration
- No new API endpoint
- Existing filing list/timeline APIs are reused for dashboard aggregation

## Rollback Plan

- Remove `/admin/payroll-year-end-filing/ops` route and component.
- Revert admin sidebar link and execution-console cross-link.
- Revert WI-0198 e2e wiring and roadmap/spec updates.

## Definition of Done (DoD)

- [x] Dedicated filing ops dashboard route exists and is reachable from admin navigation.
- [x] Status summary cards render from filing submission list summary data.
- [x] Evidence summary cards render from submission metadata + timeline evidence events.
- [x] Existing execution console remains functional and links to ops dashboard.
- [x] WI-0198 e2e exists and is wired into MVP/FULL suites.
- [x] Payroll contract/api/test-cases/roadmap/work-item docs are synced.

