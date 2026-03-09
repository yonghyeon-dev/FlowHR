# WI-1055: Admin operational settings productization

## Background

Core day-2 operating controls still depend on environment variables or API-only surfaces. This keeps customer operations dependent on developers instead of product UI.

## Goal

Move required customer-admin operating controls into productized admin settings or explicitly isolate them as ops-only.

## In Scope

- Webhook configuration UI plan and implementation
- Escalation threshold configuration
- Email notification settings
- Feature-flag ownership model and UI exposure rules
- Leave-policy management product surface
- Attendance security settings such as GPS/geofence
- Durable employee notification preference strategy with admin defaults

## Out Of Scope

- Internal-only infrastructure secrets that must remain outside customer-admin control
- CI hardening work

## Acceptance Criteria

1. Customer-operated settings no longer require direct env changes.
2. Hidden ops-only controls are clearly separated from admin product settings.
3. Leave-policy and attendance-security controls have a real admin management surface.
4. Notification preferences have a durable persistence model.

## Delivery Notes

- First execution slice productizes leave-policy management with a dedicated admin page:
  - `src/app/admin/leave-policies/page.tsx`
  - admin navigation and workspace hubs now link to `/admin/leave-policies`
- This slice uses the existing leave policy APIs instead of reopening ops-only routes:
  - `GET/PUT /api/leave/policy`
  - `GET /api/leave/policies`
  - `DELETE /api/leave/policies/[policyId]`
- Regression coverage is attached to the integration chain:
  - `scripts/tests/e2e-wi1055-admin-leave-policies-productization.test.ts`
  - `package.json` `test:integration`
- Second execution slice productizes attendance security with a dedicated admin page and org-level persistence:
  - `src/app/admin/attendance-security/page.tsx`
  - `src/app/api/admin/attendance-security/route.ts`
  - `prisma/migrations/202603090002_wi1055_attendance_security_productization/migration.sql`
  - admin navigation and workspace hubs now link to `/admin/attendance-security`
- Migration traceability:
  - `prisma/migrations/202603090002_wi1055_attendance_security_productization`
- Attendance security settings now move GPS-required and geofence controls out of env-only operation:
  - `attendanceGpsRequired`
  - `attendanceGeofenceEnabled`
  - `attendanceGeofenceLatitude`
  - `attendanceGeofenceLongitude`
  - `attendanceGeofenceRadiusMeters`
- Regression coverage is attached to the integration chain:
  - `scripts/tests/e2e-wi1055-admin-attendance-security-productization.test.ts`
  - `package.json` `test:integration`
- Third execution slice productizes durable notification defaults and employee preference persistence:
  - `src/app/admin/notification-defaults/page.tsx`
  - `src/app/api/admin/notification-defaults/route.ts`
  - `src/app/api/employee/notification-preferences/route.ts`
  - `prisma/migrations/202603090003_wi1055_notification_durability_productization/migration.sql`
- Notification defaults now move employee notification settings out of browser-only localStorage:
  - organization default email / in-app channels
  - organization default leave / attendance / payroll categories
  - employee-specific durable overrides with reset-to-default support
- Regression coverage is attached to the integration chain:
  - `scripts/tests/e2e-wi1055-notification-durability-productization.test.ts`
  - `package.json` `test:integration`
- Fourth execution slice productizes organization-level operator alert webhook fallback settings:
  - `src/app/admin/operator-alerts/page.tsx`
  - `src/app/api/admin/operator-alerts/route.ts`
  - `prisma/migrations/202603090004_wi1055_operator_alert_webhook_productization/migration.sql`
- Operator alert settings now move approval-escalation and leave-promotion fallback webhook selection out of env-only operation:
  - `operatorAlertWebhookUrl`
  - `operatorAlertWebhookProvider`
  - `approvalEscalationUseOperatorAlertWebhook`
  - `leavePromotionUseOperatorAlertWebhook`
- Regression coverage is attached to the integration chain:
  - `scripts/tests/e2e-wi1055-operator-alert-webhook-settings.test.ts`
  - `package.json` `test:integration`
- Fifth execution slice productizes organization-level leave promotion email template settings:
  - `src/app/admin/leave-promotion-email/page.tsx`
  - `src/app/api/admin/leave-promotion-email-settings/route.ts`
  - `prisma/migrations/202603090005_wi1055_leave_promotion_email_settings_productization/migration.sql`
- Leave promotion email settings now move email-template delivery defaults out of env-only operation:
  - `leavePromotionEmailTemplateUrl`
  - `leavePromotionEmailFrom`
  - `leavePromotionEmailTemplateToken`
  - `leavePromotionEmailTemplateId`
- Regression coverage is attached to the integration chain:
  - `scripts/tests/e2e-wi1055-leave-promotion-email-settings.test.ts`
  - `package.json` `test:integration`
- Sixth execution slice productizes organization-level approval escalation settings:
  - `src/app/admin/approval-escalation-settings/page.tsx`
  - `src/app/api/admin/approval-escalation-settings/route.ts`
  - `prisma/migrations/202603090006_wi1055_approval_escalation_settings_productization/migration.sql`
- Approval escalation settings now move stalled escalation defaults out of hard-coded runtime constants:
  - `approvalEscalationDefaultStalledHoursMin`
  - `approvalEscalationDefaultLimit`
  - `approvalEscalationDefaultNotificationChannel`
- Regression coverage is attached to the integration chain:
  - `scripts/tests/e2e-wi1055-approval-escalation-settings.test.ts`
  - `package.json` `test:integration`

## Data Changes (Tables and Migrations)

- Tables:
  - `Organization`
- Migrations:
  - `202603090002_wi1055_attendance_security_productization`
  - `202603090003_wi1055_notification_durability_productization`
  - `202603090004_wi1055_operator_alert_webhook_productization`
  - `202603090005_wi1055_leave_promotion_email_settings_productization`
  - `202603090006_wi1055_approval_escalation_settings_productization`
