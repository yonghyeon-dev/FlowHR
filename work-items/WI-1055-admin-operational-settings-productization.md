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
- Attendance security settings now move GPS-required and geofence controls out of env-only operation:
  - `attendanceGpsRequired`
  - `attendanceGeofenceEnabled`
  - `attendanceGeofenceLatitude`
  - `attendanceGeofenceLongitude`
  - `attendanceGeofenceRadiusMeters`
- Regression coverage is attached to the integration chain:
  - `scripts/tests/e2e-wi1055-admin-attendance-security-productization.test.ts`
  - `package.json` `test:integration`
