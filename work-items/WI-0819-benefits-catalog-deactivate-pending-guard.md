# WI-0819 Benefits Catalog Deactivate Pending Guard

## Summary
- Added server-side guard to block benefits catalog `INACTIVE` transition while submitted requests remain.
- Exposed per-catalog submitted-request count in admin benefits catalog list and disabled deactivate action when pending items exist.
- Kept existing status lifecycle endpoint and review queue behavior backward compatible.

## Scope
- `src/app/api/benefits/catalog/[benefitId]/status/route.ts`
- `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
- `specs/people/contract.yaml`
- `specs/people/api.yaml`
- `specs/people/test-cases.md`
- `scripts/tests/e2e-wi0819-benefits-catalog-deactivate-pending-guard.test.ts` (new)

## Acceptance
1. `POST /api/benefits/catalog/{benefitId}/status` returns `409` with `benefits.catalog.deactivate.pending_requests` when deactivation is attempted with pending submitted requests.
2. `/admin/benefits` catalog rows show submitted-request count and disable deactivate action while pending requests exist.
3. People contract/api/test-cases reflect the new guard behavior and version bump.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0819-benefits-catalog-deactivate-pending-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0817-benefits-catalog-status-lifecycle-and-inactive-guard.test.ts`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
