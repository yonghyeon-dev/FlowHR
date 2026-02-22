# WI-0214: Filing Ops Release Digest Acknowledgment Ledger Baseline

## Background and Problem

WI-0213 introduced release digest publication and channel delivery, but operation closure still needs an acknowledgment ledger step to track post-delivery acknowledgments and reconciliation in one deterministic view.

## Scope

### In Scope

- Add dedicated route:
  - `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger`
- Implement release digest acknowledgment ledger baseline:
  - acknowledgment ledger status (`pending`/`logged`/`verified`) with owner metadata
  - acknowledgment channel state (`pending`/`acknowledged`/`reconciled`) with ack/reference metadata
  - deterministic readiness summary combining upstream gates + closure packet/release digest readiness + acknowledgment verification and channel reconciliation
- Add release-digest and admin-nav links to the acknowledgment-ledger route.
- Add deterministic helper exports:
  - `buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerRouteHref`
  - `buildClosurePacketReleaseDigestAckLedgerRecord`
  - `applyClosurePacketReleaseDigestAckLedger`
  - `buildDefaultClosurePacketReleaseDigestAckChannelEntries`
  - `buildClosurePacketReleaseDigestAckChannelEntry`
  - `applyClosurePacketReleaseDigestAckChannelStatus`
  - `summarizeClosurePacketReleaseDigestAckLedger`
- Add WI-0214 regression test and wire to MVP/FULL e2e chains.
- Update roadmap/work-item docs.

### Out of Scope

- Persistent DB storage for acknowledgment ledger
- API/contract/schema changes
- Scheduler/automation for auto-reconciliation

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Remove acknowledgment-ledger route/components/helper and links.
- Remove WI-0214 test and chain wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Acknowledgment-ledger route exists and is reachable from admin nav and release-digest step.
- [x] Acknowledgment ledger and channel states are manageable in UI.
- [x] Readiness summary and blockers are deterministic and visible.
- [x] WI-0214 e2e exists and is wired in MVP/FULL suites.
