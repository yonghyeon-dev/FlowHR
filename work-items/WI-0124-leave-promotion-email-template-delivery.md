# WI-0124: Leave Promotion Email Template Delivery Channel

## Background and Problem

WI-0122 introduced `POST /leave/policy/promotion-notify` with Discord/Slack webhook delivery.
Roadmap follow-up requires an email-template delivery path so operators can notify employees directly without manual copy/paste.

## Scope

### In Scope

- Extend `POST /leave/policy/promotion-notify` to support `deliveryChannel=email_template`.
- Support `emailTemplateId` input (or environment default) for template-based dispatch.
- Add email-template transport config (`FLOWHR_LEAVE_PROMOTION_EMAIL_TEMPLATE_*`).
- Keep webhook path backward compatible (`deliveryChannel=webhook` default).
- Extend `/admin/leave-promotion` with channel/template controls and result telemetry.
- Add WI-0124 e2e coverage and include it in MVP/full e2e suites.

### Out of Scope

- Provider-specific rich template rendering features.
- Per-recipient retry queue/dead-letter handling.
- Employee notification preference management.

## User Scenarios

1. Admin runs dry-run with `deliveryChannel=email_template` and validates recipient counts without side effects.
2. Admin dispatches email-template notice and receives dispatched summary with recipient/template metadata.
3. Admin dispatches email-template notice when no recipient has email and system safely skips.
4. Admin dispatches email-template notice without channel config and gets actionable `503`.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Dispatch leave promotion notice (webhook/email template) | Allow | Deny | Allow | Deny | Allow |
| Dry-run leave promotion notice | Allow | Deny | Allow | Deny | Allow |

## Data and API Changes

- DB schema change: none.
- Endpoint update: `POST /leave/policy/promotion-notify`
  - New input: `deliveryChannel` (`webhook` | `email_template`)
  - New input: `emailTemplateId?`
  - Response delivery metadata extended with channel/template/recipient fields.

## Observability and Audit

- Existing audit actions reused:
  - `leave.promotion_notice.dispatched`
  - `leave.promotion_notice.dry_run`
  - `leave.promotion_notice.skipped`
  - `leave.promotion_notice.failed`
- Extended payload fields:
  - `channel`
  - `emailTemplateId`
  - `recipientCount`
  - `missingEmailCount`
  - `emailTemplateSource`

## Rollback Plan

- Set `deliveryChannel=webhook` only in operations.
- Remove email template env settings to disable external email-template dispatch.
- Keep dry-run mode active for verification during rollback.
- Recovery target: 30m.

## Definition of Done (DoD)

- [x] `promotion-notify` supports `deliveryChannel=email_template` without breaking webhook behavior.
- [x] Admin leave-promotion page supports channel/template control and displays delivery telemetry.
- [x] WI-0124 e2e passes and is added to MVP/full e2e suites.
- [x] Leave specs and roadmap are updated and version-aligned.
