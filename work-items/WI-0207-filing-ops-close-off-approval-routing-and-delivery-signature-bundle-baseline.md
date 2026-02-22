# WI-0207: Filing Ops Close-off Approval Routing and Delivery Signature Bundle Baseline

## Background and Problem

WI-0206 introduced close-off package and audit sign-off, but operators still need a dedicated surface to track approval routing progression and delivery signature bundle readiness before final delivery.

## Scope

### In Scope

- Add dedicated route:
  - `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature`
- Implement routing/signature bundle baseline:
  - approval routing stages (`prepare`, `manager_review`, `admin_signoff`, `delivery_ack`) with statuses (`pending`/`in_progress`/`done`/`blocked`)
  - delivery signature channels (`hometax_upload`, `manual_portal`, `internal_archive`) with statuses (`pending`/`signed`/`failed`)
  - deterministic readiness summary combining handoff/export/archive gates + routing completion + signature completion
- Add close-off and admin-nav links to routing/signature bundle route.
- Add deterministic helper exports:
  - `buildCloseOffRoutingSignatureBundleRouteHref`
  - `buildApprovalRoutingEntry`
  - `applyApprovalRoutingStatus`
  - `buildDeliverySignatureEntry`
  - `applyDeliverySignature`
  - `summarizeRoutingSignatureBundle`
- Add WI-0207 regression test and wire to MVP/FULL e2e chains.
- Update roadmap/work-item docs.

### Out of Scope

- Persistent DB storage for routing/signature bundles
- API/contract/schema changes
- Scheduler/notification automation

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Remove routing/signature route/component/helper and links.
- Remove WI-0207 test and chain wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Routing/signature route exists and is reachable from admin nav and close-off package.
- [x] Routing stages and signature channels are manageable in UI.
- [x] Ready-to-deliver summary and blockers are deterministic and visible.
- [x] WI-0207 e2e exists and is wired in MVP/FULL suites.
