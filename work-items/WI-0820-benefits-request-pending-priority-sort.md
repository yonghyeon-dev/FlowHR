# WI-0820 Benefits Request Pending Priority Sort

## Summary
- Added optional `sort` query support to `GET /api/benefits/requests`.
- Implemented `pending_priority` ordering so review queues are returned with `SUBMITTED` requests first and oldest submitted requests at the top.
- Wired admin benefits workspace refresh to request `sort=pending_priority` for reviewer-first queue behavior.

## Scope
- `src/features/benefits/types.ts`
- `src/features/benefits/schemas.ts`
- `src/features/benefits/store.ts`
- `src/app/api/benefits/requests/route.ts`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `specs/people/contract.yaml`
- `specs/people/api.yaml`
- `specs/people/test-cases.md`
- `scripts/tests/e2e-wi0820-benefits-request-pending-priority-sort.test.ts` (new)

## Acceptance
1. `GET /api/benefits/requests` accepts optional `sort` query with `updated_desc | pending_priority`.
2. `sort=pending_priority` returns submitted requests before non-submitted requests, and submitted items are ordered by oldest `requestedAt` first.
3. `/admin/benefits` workspace request load path uses `sort=pending_priority` to keep review queue priority-focused by default.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0820-benefits-request-pending-priority-sort.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0819-benefits-catalog-deactivate-pending-guard.test.ts`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
