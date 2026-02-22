# WI-0205: Filing Ops Checklist Review Handoff and Export Snapshot Baseline

## Background and Problem

WI-0204 added retrospective comments and role-based approval snapshot, but close-off still lacks an explicit handoff packet and export snapshot proof surface.

## Scope

### In Scope

- Add dedicated route:
  - `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff`
- Implement handoff/export snapshot baseline:
  - review handoff packet (`from/to role`, actor handoff, due time, escalation path, note)
  - filing export snapshot (`format`, `validation`, `record count`, `checksum`, `artifact id`, `exportedAt`)
  - deterministic close-readiness summary combining approvals, handoff completeness, and export validity
- Add approval-snapshot and admin-nav links to handoff/export snapshot route.
- Add deterministic helper exports:
  - `buildReviewSnapshotHandoffRouteHref`
  - `buildReviewHandoffPacket`
  - `buildFilingExportSnapshot`
  - `summarizeReviewHandoffExportSnapshot`
- Add WI-0205 regression test and wire to MVP/FULL e2e chains.
- Update roadmap/work-item docs.

### Out of Scope

- Persistent DB storage for handoff/export snapshots
- API/contract/schema changes
- Scheduler/notification automation

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Remove handoff route/component/helper and links.
- Remove WI-0205 test and chain wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Handoff/export snapshot route exists and is reachable from admin nav and approval snapshot.
- [x] Handoff packet and export snapshot can be composed in UI.
- [x] Close-readiness summary is deterministic and visible.
- [x] WI-0205 e2e exists and is wired in MVP/FULL suites.
