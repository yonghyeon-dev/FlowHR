# WI-0932 Organization Settings Admin API

## Scope
- Add admin-only organization settings read/update APIs for post-onboarding maintenance.
- Support updates for organization profile and work-hour policy fields.

## Implementation
- Added `GET /api/admin/organization/settings` and `PATCH /api/admin/organization/settings`:
  - File: `src/app/api/admin/organization/settings/route.ts`
  - Admin role required.
  - Organization scope enforced from actor `organizationId`.
  - Response fields:
    - `name`
    - `businessNumber`
    - `fiscalYearStart`
    - `workHoursPerDay`
    - `overtimeThreshold`
    - `timezone`
  - `PATCH` validation:
    - `name`, `businessNumber`, `timezone` as non-empty strings when present.
    - `fiscalYearStart` as `MM-DD`.
    - `workHoursPerDay` positive number (`<= 24`).
    - `overtimeThreshold` non-negative number (`<= 24`).
- Extended organization data model and adapters:
  - `src/features/shared/data-access.ts`
  - `src/features/shared/memory-data-access.ts`
  - `src/features/shared/prisma-data-access.ts`
- Added defaults on organization create:
  - `fiscalYearStart: "01-01"`
  - `workHoursPerDay: 8`
  - `overtimeThreshold: 8`

## Test
- Added `scripts/tests/e2e-wi0932-org-settings.test.ts`:
  - Setup organization using memory data access.
  - GET settings and verify defaults.
  - PATCH settings and verify updated values.
  - Employee role returns `403`.
  - Invalid `workHoursPerDay: -1` returns `400`.

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0932-org-settings.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

## Data Changes
- Prisma model: `Organization`
  - Added `fiscalYearStart` (`String`, default `"01-01"`)
  - Added `workHoursPerDay` (`Float`, default `8`)
  - Added `overtimeThreshold` (`Float`, default `8`)
- Migration: `prisma/migrations/202603050006_wi0932_org_settings/migration.sql`
