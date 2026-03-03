# WI-0816 Benefits DB Persistence Read Model

## Summary
- Replaced benefits in-memory store path with runtime data-access backed persistence.
- Added Prisma read-model entities for benefits catalog and requests.
- Wired both memory/prisma data-access implementations and updated benefits API routes to await async store operations.
- Preserved legacy baseline identifiers (`initialCatalogStore`, `initialRequestStore`) and cancel/summary compatibility semantics to keep existing regression contracts stable.

## Scope
- `prisma/schema.prisma`
- `prisma/migrations/202603030001_wi0816_benefits_db_read_model/migration.sql` (new)
- `src/features/shared/data-access.ts`
- `src/features/shared/memory-data-access.ts`
- `src/features/shared/prisma-data-access.ts`
- `src/features/benefits/store.ts`
- `src/app/api/benefits/catalog/route.ts`
- `src/app/api/benefits/requests/route.ts`
- `src/app/api/benefits/requests/[requestId]/decision/route.ts`
- `src/app/api/benefits/requests/[requestId]/cancel/route.ts`
- `scripts/tests/e2e-wi0816-benefits-db-persistence-read-model.test.ts` (new)

## Data Changes
- Prisma models: `BenefitCatalogItem`, `BenefitRequest`
- Migration: `202603030001_wi0816_benefits_db_read_model`

## Acceptance
1. Benefits catalog/request persistence uses runtime data-access (prisma by default, memory fallback).
2. Prisma schema includes benefits models/enums and migration SQL exists.
3. Existing benefits journey regression tests continue to pass.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0408-benefits-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0424-benefits-request-cancel-self-service.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0814-employee-benefits-deeplink-filters-and-session-autoload.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0816-benefits-db-persistence-read-model.test.ts`
- `npm.cmd run build`

