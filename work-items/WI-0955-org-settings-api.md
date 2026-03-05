# WI-0955 Organization Settings API (Fiscal Year + Work Hours)

## Scope
- Add admin-only organization settings APIs for payroll/leave/attendance baseline policy fields.
- Support partial updates for fiscal year month, work hours/days, overtime threshold, pay period, timezone, and currency.

## Implementation
- Added `GET /api/admin/settings` and `PATCH /api/admin/settings`:
  - File: `src/app/api/admin/settings/route.ts`
  - Admin role required with organization scope from actor context.
  - `GET` returns:
    - `fiscalYearStartMonth`
    - `standardWorkHoursPerDay`
    - `standardWorkDaysPerWeek`
    - `overtimeThresholdHours`
    - `payPeriod`
    - `timezone`
    - `currency`
  - `PATCH` accepts partial fields and validates:
    - `fiscalYearStartMonth`: integer `1..12`
    - `standardWorkHoursPerDay`: number `1..24`
    - `standardWorkDaysPerWeek`: integer `1..7`
    - `overtimeThresholdHours`: number `0..168`
    - `payPeriod`: `MONTHLY | BIWEEKLY`
    - `timezone`: non-empty string
    - `currency`: 3-letter ISO-like code
- Extended organization data model:
  - Prisma schema + migration for:
    - `fiscalYearStartMonth` (default `1`)
    - `standardWorkHoursPerDay` (default `8`)
    - `standardWorkDaysPerWeek` (default `5`)
    - `overtimeThresholdHours` (default `8`)
    - `payPeriod` (enum, default `MONTHLY`)
    - `currency` (default `KRW`)
  - Files:
    - `prisma/schema.prisma`
    - `prisma/migrations/202603050012_wi0955_org_settings_api/migration.sql`
- Updated shared data-access adapters:
  - `src/features/shared/data-access.ts`
  - `src/features/shared/memory-data-access.ts`
  - `src/features/shared/prisma-data-access.ts`
- Kept legacy org settings compatibility:
  - Existing `src/app/api/admin/organization/settings/route.ts` now also updates the new normalized fields when legacy fields are patched.

## Data Changes

- `202603050012_wi0955_org_settings_api`
- `Organization`

## Test
- Added `scripts/tests/e2e-wi0955-org-settings.test.ts`:
  - Get defaults returns expected baseline values.
  - Update fiscal year start month returns `200`.
  - Invalid month (`13`) returns `400`.
  - Non-admin request returns `403`.
  - Partial update changes only targeted field(s).

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0955-org-settings.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
