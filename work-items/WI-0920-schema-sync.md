# WI-0920 Schema/Memory Sync Validation

## Scope
- Validate that entities/stores added in WI-0910 ~ WI-0917 are reflected in `prisma/schema.prisma`.
- Add missing Prisma models/fields and migration SQL.
- Align `prisma-data-access.ts` with schema so Prisma-backed stores and field mappings are complete.
- Add regression test to fail when `DataAccess` store keys and schema model mapping diverge.

## Implemented
- `prisma/schema.prisma`
  - Added models:
    - `OnboardingTask`
    - `InsuranceEnrollment`
  - Added enums:
    - `OnboardingTaskStatus`
    - `InsuranceEnrollmentType`
    - `InsuranceEnrollmentStatus`
  - Added `Employee` fields:
    - `phone`, `address`
  - Added `RecruitmentOpening` field:
    - `hiringManagerId`
  - Added `RecruitmentReferral` field:
    - `stageReason`
  - Added `BenefitCatalogItem` fields:
    - `enrollmentStartDate`, `enrollmentEndDate`

- `prisma/migrations/202603050002_sync_wi0910_to_wi0917/migration.sql`
  - SQL migration for all schema deltas above.
  - `npx prisma migrate dev --name sync-wi0910-to-wi0917` failed in this environment (`P3006`, shadow DB missing `auth` schema), so `npx prisma migrate diff --script` output was used as fallback SQL migration.

- `src/features/shared/prisma-data-access.ts`
  - `employees` store now persists/maps `phone`, `address`.
  - `benefits` store now persists/maps `enrollmentStartDate`, `enrollmentEndDate`.
  - `recruitment` store now persists/maps `hiringManagerId`, `stageReason`.
  - Replaced in-memory temporary implementations with Prisma-backed stores for:
    - `onboardingTasks`
    - `insuranceEnrollments`

- `scripts/tests/e2e-wi0920-schema-sync.test.ts`
  - Compares `DataAccess` key set with explicit store-to-model mapping key set.
  - Verifies every mapped Prisma model exists in `prisma/schema.prisma`.
  - Fails on mismatch.

## Verification
- `npx prisma migrate dev --name sync-wi0910-to-wi0917` (failed: shadow DB `auth` schema missing)
- `npx prisma migrate diff --from-schema-datamodel .tmp/schema.before-wi0920.prisma --to-schema-datamodel prisma/schema.prisma --script`
- `npx prisma generate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
