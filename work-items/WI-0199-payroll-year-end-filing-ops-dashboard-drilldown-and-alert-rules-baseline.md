> **DEPRECATED**: This WI deliverable was consolidated by filing-ops de-bloat cleanup (WI-0218).`n> Reference: docs/codex-guide.md Part 1.5`n# WI-0199: Payroll Year-End Filing Ops Dashboard Drilldown and Alert Rules Baseline

## Background and Problem

WI-0198 split filing operations monitoring into `/admin/payroll-year-end-filing/ops` with status/evidence summary cards.
Operators can see counts, but cannot quickly focus on problematic subsets or apply explicit watch/critical thresholds per metric.

WI-0199 adds drilldown and alert-rule baseline so operators can triage pending/rejected/failing/evidence-gap rows with deterministic rule evaluation.

## Scope

### In Scope

- Extend filing ops dashboard (`/admin/payroll-year-end-filing/ops`) with:
  - alert rule configuration (watch/critical) for:
    - pending queue
    - rejected ACK
    - validation-fail
    - evidence-gap
    - timeline-failure
  - per-rule severity evaluation (`NORMAL`/`WATCH`/`CRITICAL`) and overall severity
  - drilldown mode selector:
    - pending
    - rejected
    - validation_fail
    - evidence_gap
    - timeline_failure
  - drilldown row list and filter-preset sync
- Keep existing APIs unchanged and reuse:
  - `GET /payroll/year-end/filing-submissions`
  - `GET /payroll/year-end/filing-submissions/{submissionId}/timeline`
- Export deterministic helper functions for alert/drilldown calculation and cover with e2e assertions.
- Add WI-0199 regression test:
  - `scripts/tests/e2e-wi0199-payroll-year-end-filing-ops-dashboard-drilldown-alert-rules.test.ts`
- Wire WI-0199 test into MVP/FULL chains.
- Update payroll specs/docs (contract/api/test-cases/roadmap/work-item).

### Out of Scope

- New filing APIs or DB migrations
- Scheduler/cron or autonomous alert delivery
- Bulk action execution from ops dashboard

## User Scenarios

1. Payroll operator sets explicit watch/critical thresholds and sees current ops severity instantly.
2. Payroll operator switches drilldown mode to inspect only affected rows (rejected/evidence-gap/etc.).
3. Payroll operator applies drilldown preset and refreshes with aligned filters for deterministic triage.

## Data and API Changes

- No DB migration
- No new API endpoint
- UI-only extension using existing filing list/timeline data

## Rollback Plan

- Revert WI-0199 ops dashboard drilldown/alert UI changes.
- Remove WI-0199 test and package e2e chain wiring.
- Revert payroll roadmap/spec updates.

## Definition of Done (DoD)

- [x] Ops dashboard supports alert rules with watch/critical thresholds and deterministic severity output.
- [x] Ops dashboard supports drilldown modes and renders focused row list by mode.
- [x] Existing filing list/timeline flow remains unchanged and permission-guarded.
- [x] WI-0199 e2e exists and is wired into MVP/FULL suites.
- [x] Payroll contract/api/test-cases/roadmap/work-item docs are synced.

