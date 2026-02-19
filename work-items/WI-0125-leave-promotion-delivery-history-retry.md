# WI-0125: Leave Promotion Delivery History and Per-Recipient Retry

## Background and Problem

WI-0124 introduced `deliveryChannel=email_template`, but operators still lacked a durable history model for each dispatch and a way to retry only failed recipients.
Production operations require delivery traceability and targeted retry without re-sending to already-successful recipients.

## Scope

### In Scope

- Add durable delivery history model for annual leave promotion notify:
  - delivery summary row
  - recipient snapshot rows
  - retry-chain linkage (`retryOfDeliveryId`)
- Persist history for `dry_run`, `skipped_no_targets`, `dispatched`, and `failed` outcomes.
- Add delivery history APIs:
  - `GET /leave/policy/promotion-deliveries`
  - `GET /leave/policy/promotion-deliveries/{deliveryId}`
  - `POST /leave/policy/promotion-deliveries/{deliveryId}/retry`
- Add `/admin/leave-promotion` history/retry UI controls.
- Add WI-0125 e2e coverage and include in MVP/full suites.

### Out of Scope

- Background retry queue scheduler.
- Dead-letter queue and exponential backoff policy orchestration.
- Employee notification preference center.

## User Scenarios

1. Admin lists promotion deliveries filtered by channel/status and reviews dispatch outcomes.
2. Admin opens one delivery and checks recipient-level send status and error messages.
3. Admin retries only failed email-template recipients using dry-run first, then executes real retry.
4. Retry execution creates a linked delivery history row and preserves retry-chain traceability.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| List/read promotion delivery history | Allow | Deny | Allow | Deny | Allow |
| Retry promotion delivery recipients | Allow | Deny | Allow | Deny | Allow |

## Data and API Changes

- DB schema change:
  - `LeavePromotionDelivery`
  - `LeavePromotionDeliveryRecipient`
  - enums:
    - `LeavePromotionDeliveryChannel`
    - `LeavePromotionDeliveryStatus`
    - `LeavePromotionRecipientStatus`
- Existing endpoint update:
  - `POST /leave/policy/promotion-notify` now persists delivery/recipient history rows.
- New endpoints:
  - `GET /leave/policy/promotion-deliveries`
  - `GET /leave/policy/promotion-deliveries/{deliveryId}`
  - `POST /leave/policy/promotion-deliveries/{deliveryId}/retry`

## Observability and Audit

- Added/extended audit actions:
  - `leave.promotion_delivery.list_read`
  - `leave.promotion_delivery.read`
  - `leave.promotion_notice.retry_dry_run`
  - `leave.promotion_notice.retry_skipped`
  - `leave.promotion_notice.retry_dispatched`
  - `leave.promotion_notice.retry_failed`
  - `leave.promotion_notice.retry_event_publish_failed`
- Dispatch/retry success continues publishing:
  - `leave.promotion.notice.dispatched.v1`
  - payload includes `deliveryId` and retry linkage when applicable.

## Rollback Plan

- Stop using retry endpoint in operations.
- Keep promotion notify in `dryRun=true` mode during rollback verification.
- If needed, use webhook-only channel in operations while keeping history tables intact.
- Recovery target: 30m.

## Definition of Done (DoD)

- [x] Delivery/recipient history persists for all promotion notify outcomes.
- [x] History list/detail/retry APIs are implemented and permission/tenant-guarded.
- [x] Admin leave-promotion page supports history read and targeted retry execution.
- [x] WI-0125 e2e added and wired into MVP/full e2e suites.
- [x] Leave specs and roadmap are version-aligned with WI-0125.
