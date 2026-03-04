# WI-0917 Benefits Enrollment Period

## Scope
- Add enrollment-period fields to benefit catalog items so admins can define when employees may submit requests.
- Apply enrollment-period validation when creating benefit requests.
- Ensure catalog APIs expose enrollment-period fields.

## Implementation
- Data model updates:
  - `src/features/shared/data-access.ts`
    - `BenefitCatalogItemEntity` adds:
      - `enrollmentStartDate?: string`
      - `enrollmentEndDate?: string`
    - `CreateBenefitCatalogItemInput` / `UpdateBenefitCatalogItemInput` add the same optional fields.
  - `src/features/shared/memory-data-access.ts`
    - `benefits.createCatalogItem` stores enrollment start/end dates.
    - `benefits.updateCatalogItem` supports updating enrollment start/end dates.
- Benefits schema/store/API updates:
  - `src/features/benefits/schemas.ts`
    - `createBenefitCatalogSchema` accepts `enrollmentStartDate`, `enrollmentEndDate` (`YYYY-MM-DD`).
    - Validates `enrollmentStartDate <= enrollmentEndDate` when both provided.
  - `src/features/benefits/types.ts`
    - `BenefitCatalogItem` adds enrollment start/end date optional fields.
  - `src/features/benefits/store.ts`
    - Catalog mapping and create flow pass through enrollment start/end date.
  - `src/app/api/benefits/catalog/route.ts`
    - `POST /api/benefits/catalog` now accepts and stores enrollment start/end date from request body.
  - `src/app/api/benefits/requests/route.ts`
    - `POST /api/benefits/requests` now validates current date against the catalog enrollment period.
    - Returns `400` with `error: "enrollment_period_closed"` when outside enrollment period.

## Test
- Added `scripts/tests/e2e-wi0917-benefits-enrollment-period.test.ts`.
- Coverage:
  - Create catalog item with future enrollment period (`tomorrow ~ day after tomorrow`).
  - Employee request attempt before start date returns `400` and `enrollment_period_closed`.
  - Create catalog item with active period (`yesterday ~ tomorrow`).
  - Employee request succeeds with `201`.
  - Catalog list includes enrollment period fields.

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0917-benefits-enrollment-period.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
