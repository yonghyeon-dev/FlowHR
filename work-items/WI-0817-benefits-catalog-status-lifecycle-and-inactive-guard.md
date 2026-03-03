# WI-0817 Benefits Catalog Status Lifecycle And Inactive Guard

## Summary
- Added benefits catalog status lifecycle endpoint for admin/manager runtime control (`ACTIVE`/`INACTIVE`).
- Blocked benefits request submission when catalog item is inactive or organization scope mismatches.
- Hardened request decision flow to reject non-`SUBMITTED` items with invalid-state response.
- Updated admin benefits workspace with catalog status create input and per-item activate/deactivate actions.
- Normalized Korean copy for benefits workspace to remove mojibake on product surfaces.

## Scope
- `src/app/api/benefits/catalog/[benefitId]/status/route.ts` (new)
- `src/app/api/benefits/requests/route.ts`
- `src/app/api/benefits/requests/[requestId]/decision/route.ts`
- `src/features/benefits/store.ts`
- `src/features/benefits/schemas.ts`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
- `src/components/benefits/copy.ts`
- `specs/people/contract.yaml`
- `specs/people/api.yaml`
- `specs/people/test-cases.md`
- `scripts/tests/e2e-wi0817-benefits-catalog-status-lifecycle-and-inactive-guard.test.ts` (new)

## Acceptance
1. Admin/manager can toggle catalog item status via API and `/admin/benefits` UI.
2. Benefits request submission is rejected for inactive or organization-mismatched catalog items.
3. Benefits decision endpoint rejects non-`SUBMITTED` requests with `409 invalid_state`.
4. Benefits Korean runtime copy renders readable product text.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0817-benefits-catalog-status-lifecycle-and-inactive-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0408-benefits-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0424-benefits-request-cancel-self-service.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
