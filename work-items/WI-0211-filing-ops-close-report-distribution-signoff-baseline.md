# WI-0211: Filing Ops Close Report Distribution Sign-off Baseline

## Background and Problem

WI-0210 introduced completion close report publishing, but operations still need a final distribution/sign-off step to verify channel delivery confirmations and role sign-off before final closure.

## Scope

### In Scope

- Add dedicated route:
  - `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff`
- Implement close report distribution sign-off baseline:
  - distribution channel state (`pending`/`distributed`/`confirmed`) with batch/group metadata
  - role sign-off state (`pending`/`signed`/`rejected`) with actor/note metadata
  - deterministic readiness summary combining upstream gates + close report publication + distribution/sign-off completion
- Add completion-close-report and admin-nav links to distribution-signoff route.
- Add deterministic helper exports:
  - `buildCloseReportDistributionSignoffRouteHref`
  - `buildDefaultCloseReportDistributionEntries`
  - `buildCloseReportDistributionEntry`
  - `applyCloseReportDistributionStatus`
  - `buildDefaultCloseReportSignoffEntries`
  - `buildCloseReportSignoffEntry`
  - `applyCloseReportSignoffStatus`
  - `summarizeCloseReportDistributionSignoff`
- Add WI-0211 regression test and wire to MVP/FULL e2e chains.
- Update roadmap/work-item docs.

### Out of Scope

- Persistent DB storage for distribution/sign-off records
- API/contract/schema changes
- Scheduler/notification automation

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Remove distribution-signoff route/components/helper and links.
- Remove WI-0211 test and chain wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Distribution-signoff route exists and is reachable from admin nav and completion-close-report step.
- [x] Distribution channels and role sign-off states are manageable in UI.
- [x] Readiness summary and blockers are deterministic and visible.
- [x] WI-0211 e2e exists and is wired in MVP/FULL suites.
