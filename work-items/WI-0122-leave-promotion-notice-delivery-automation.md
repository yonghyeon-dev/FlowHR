# WI-0122: Leave Promotion Notice Delivery Automation

## Background and Problem

WI-0120 added annual leave promotion preview and draft generation, but notice delivery was still manual copy/paste.
For production SaaS operations, admins need a direct dispatch path with dry-run verification and delivery traceability.

## Scope

### In Scope

- Add `POST /leave/policy/promotion-notify` API for notice dispatch orchestration.
- Add webhook channel resolution for leave promotion notices (Discord/Slack).
- Support `dryRun` mode to validate output without webhook side effects.
- Add audit trail for dispatch lifecycle (`dry_run`, `skipped`, `dispatched`, `failed`).
- Extend `/admin/leave-promotion` with dry-run/dispatch controls and delivery summary.
- Add WI-0122 e2e coverage.

### Out of Scope

- Direct employee email/SMS delivery.
- Channel-specific rich templates (embed blocks, markdown variants).
- Delivery retry queue and dead-letter handling.

## User Scenarios

1. Admin runs dry-run for promotion notice and validates target list/message before release.
2. Admin dispatches promotion notice during open window and webhook is delivered to configured channel.
3. Admin executes dispatch when no current target exists and system skips delivery safely.
4. Admin executes dispatch with missing webhook config and receives actionable failure.

## Payroll Accuracy and Policy Rules

- Promotion notice automation reads leave policy and balance projection only.
- No payroll deduction/gross/net calculation logic is changed by this WI.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Dispatch promotion notice | Allow | Deny | Allow | Deny | Allow |
| Dry-run promotion notice | Allow | Deny | Allow | Deny | Allow |

## Data and API Changes

- DB schema change: none.
- New endpoint: `POST /leave/policy/promotion-notify`
  - Inputs: `organizationId?`, `asOf?`, `includeUpcoming?`, `dryRun?`
  - Output: preview snapshot + delivery status metadata.

## Observability and Audit

- Added audit actions:
  - `leave.promotion_notice.dispatched`
  - `leave.promotion_notice.dry_run`
  - `leave.promotion_notice.skipped`
  - `leave.promotion_notice.failed`

## Rollback Plan

- Keep preview API active and disable dispatch usage by removing webhook env variables.
- Use `dryRun=true` only mode until channel config is validated.
- Recovery target: 30m.

## Definition of Done (DoD)

- [x] Dispatch API with dry-run/no-target/missing-webhook handling is implemented.
- [x] Admin UI can trigger dry-run and real dispatch.
- [x] WI-0122 e2e passes and is included in MVP/full e2e suites.
- [x] `specs/leave/*` and `ROADMAP.md` are updated and version-aligned.
