# WI-0204: Filing Ops Checklist Retrospective Comment and Review Approval Snapshot Baseline

## Background and Problem

WI-0203 introduced checklist execution logs and review loop stage summary, but operators still need a dedicated surface for retrospective comments and role-based review approval snapshot before close-off.

## Scope

### In Scope

- Add dedicated route:
  - `/admin/payroll-year-end-filing/ops/checklist/review/snapshot`
- Implement retrospective comment and approval snapshot baseline:
  - retrospective comments (`what_went_well`/`risk`/`follow_up`)
  - role-based approval decisions (`pending`/`approved`/`rework`) for payroll operator, manager, admin
  - deterministic approval snapshot summary (`approved`/`pending`/`rework` counts + ready-to-close)
- Add review-loop and admin-nav links to snapshot route.
- Add deterministic helper exports:
  - `buildChecklistReviewSnapshotRouteHref`
  - `buildRetrospectiveCommentEntry`
  - `summarizeReviewApprovalSnapshot`
  - `applyReviewApprovalDecision`
- Add WI-0204 regression test and wire to MVP/FULL e2e chains.
- Update roadmap/work-item docs.

### Out of Scope

- Persistent DB storage for comments/approvals
- API/contract/schema changes
- Scheduler/notification automation

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Remove snapshot route/component/helper and links.
- Remove WI-0204 test and chain wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Snapshot route exists and is reachable from admin nav and review loop.
- [x] Retrospective comments and review approval decisions are manageable in UI.
- [x] Approval snapshot summary and ready-to-close state are deterministic and visible.
- [x] WI-0204 e2e exists and is wired in MVP/FULL suites.
