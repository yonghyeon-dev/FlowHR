# WI-0202: Filing Ops Alert Execution Checklist and Completion Tracking Baseline

## Background and Problem

WI-0201 added alert response action guidance and owner assignment on filing ops dashboard, but operations still lacks a dedicated execution checklist tracker to follow and complete alert actions consistently.

## Scope

### In Scope

- Add dedicated route for checklist tracking:
  - `/admin/payroll-year-end-filing/ops/checklist`
- Implement checklist tracker baseline:
  - metric/level owner context controls
  - deterministic checklist row builder by alert metric
  - per-task completion toggles
  - completion summary and completion timestamp
- Link checklist workflow from filing ops dashboard alert response rows.
- Add admin navigation link and i18n labels for checklist route.
- Add WI-0202 regression test and wire to MVP/FULL e2e chains.
- Update roadmap and work-item docs.

### Out of Scope

- DB persistence for checklist completion states
- New API endpoints or contract updates
- Scheduler/automation for checklist execution

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Remove checklist route/component and dashboard checklist link.
- Remove WI-0202 e2e test and chain wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Dedicated checklist route exists and is reachable from admin nav and ops dashboard.
- [x] Alert metric execution checklist rows can be tracked to completion in UI.
- [x] Completion progress summary and completion timestamp are shown.
- [x] WI-0202 e2e exists and is wired in MVP/FULL suites.
