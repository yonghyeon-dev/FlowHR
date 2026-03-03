# WI-0836 Admin Dashboard Contract Risk Links

## Summary
- Extended admin dashboard communication hub with contract risk queue links.
- Added direct links for contract SLA overdue queue and pending response queue.
- Updated ko/en communication hub labels to include contracts.

## Scope
- `src/app/admin/page-workspace-hubs.ts`
- `scripts/tests/e2e-wi0836-admin-dashboard-contract-risk-links.test.ts` (new)

## Acceptance
1. Admin dashboard communication hub includes contract SLA overdue and pending-response deep links.
2. Contract risk links are available in both ko/en locale maps.
3. Existing notice/benefits/recruitment communication links remain available.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0836-admin-dashboard-contract-risk-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0828-admin-benefits-pending-aging-risk-filter-and-dashboard-hub-deeplink.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
