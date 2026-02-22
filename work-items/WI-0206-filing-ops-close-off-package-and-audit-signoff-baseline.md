> **DEPRECATED**: This WI deliverable was consolidated by filing-ops de-bloat cleanup (WI-0218).
> Reference: docs/codex-guide.md Part 1.5
# WI-0206: Filing Ops Close-off Package and Audit Sign-off Baseline

## Background and Problem

WI-0205 added handoff and export snapshot evidence, but operators still need a dedicated close-off package surface for role-based audit sign-off and archival readiness.

## Scope

### In Scope

- Add dedicated route:
  - `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off`
- Implement close-off package baseline:
  - audit sign-off grid (`pending`/`signed`/`rejected`) by payroll operator, manager, admin
  - archive package context (`bundle id`, handoff/export readiness, archive note)
  - deterministic readiness summary (`signed`/`pending`/`rejected` counts + blockers + ready-to-archive)
- Add handoff snapshot and admin-nav links to close-off route.
- Add deterministic helper exports:
  - `buildReviewCloseOffRouteHref`
  - `buildAuditSignOffEntry`
  - `applyAuditSignOffDecision`
  - `summarizeCloseOffPackage`
- Add WI-0206 regression test and wire to MVP/FULL e2e chains.
- Update roadmap/work-item docs.

### Out of Scope

- Persistent DB storage for close-off package/sign-off
- API/contract/schema changes
- Scheduler/notification automation

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Remove close-off route/component/helper and links.
- Remove WI-0206 test and chain wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Close-off route exists and is reachable from admin nav and handoff snapshot.
- [x] Audit sign-off entries and archive package context are manageable in UI.
- [x] Ready-to-archive summary and blockers are deterministic and visible.
- [x] WI-0206 e2e exists and is wired in MVP/FULL suites.

