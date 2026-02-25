# WI-0408: Benefits Core Journey Implementation

## Summary
- Goal: replace baseline-only benefits pages with a practical catalog/request/decision core journey.
- Change:
  - Added benefits domain store for catalog and requests with seeded baseline data.
  - Added API routes:
    - `GET/POST /api/benefits/catalog`
    - `GET/POST /api/benefits/requests`
    - `POST /api/benefits/requests/{requestId}/decision`
  - Replaced `/admin/benefits` with `AdminBenefitsWorkspace` (catalog create + review queue approve/reject).
  - Replaced `/employee/benefits` with `EmployeeBenefitsWorkspace` (catalog browse + request submit + history).
  - Added dedicated copy maps for admin/employee benefits surfaces and WI-0408 regression test.
- Outcome:
  - Benefits domain now supports end-to-end workflow: catalog definition -> employee request -> admin decision.

## Scope
- `src/features/benefits/types.ts`
- `src/features/benefits/store.ts`
- `src/features/benefits/schemas.ts`
- `src/app/api/benefits/catalog/route.ts`
- `src/app/api/benefits/requests/route.ts`
- `src/app/api/benefits/requests/[requestId]/decision/route.ts`
- `src/components/benefits/copy.ts`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `src/app/admin/benefits/page.tsx`
- `src/app/employee/benefits/page.tsx`
- `scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- `scripts/tests/e2e-wi0408-benefits-core-journey-implementation.test.ts`
- `work-items/WI-0408-benefits-core-journey-implementation.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0408-benefits-core-journey-implementation.test.ts`
- `npm.cmd run -s build`
