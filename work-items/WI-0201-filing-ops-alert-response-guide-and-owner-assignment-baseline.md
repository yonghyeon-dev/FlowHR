# WI-0201: Filing Ops Alert Response Guide and Owner Assignment Baseline

## Background and Problem

WI-0199 introduced drilldown and alert severity for payroll year-end filing ops, but operators still need explicit execution guidance and owner assignment for each alert metric.

## Scope

### In Scope

- Extend `/admin/payroll-year-end-filing/ops` dashboard with:
  - metric-level response guide (`watch`/`critical` action text)
  - escalation path and follow-up SLA hint by metric
  - owner assignment baseline (owner role + actor ID)
  - active/unassigned owner summary
  - quick jump from metric response row to matching drilldown mode
- Add deterministic helper exports:
  - `resolveDrilldownModeFromAlertMetric`
  - `buildFilingOpsAlertResponseRows`
- Add WI-0201 regression test:
  - `scripts/tests/e2e-wi0201-filing-ops-alert-response-guide-and-owner-assignment-baseline.test.ts`
- Wire WI-0201 test into MVP/FULL e2e chains.
- Update roadmap/work-item docs.

### Out of Scope

- New API endpoints or DB schema changes
- Scheduler/notification automation
- Persistent owner assignment storage

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Revert alert response guide/owner assignment UI in filing ops dashboard.
- Remove WI-0201 e2e and chain wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Filing ops dashboard exposes alert response guide rows for all alert metrics.
- [x] Owner assignment role/actor ID can be edited per metric and reflected in summary.
- [x] Response rows can jump to corresponding drilldown mode.
- [x] WI-0201 e2e exists and is wired into MVP/FULL suites.
