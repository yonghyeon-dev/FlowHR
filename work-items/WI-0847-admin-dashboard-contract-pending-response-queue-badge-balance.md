# WI-0847 Admin Dashboard Contract Pending-Response Queue Badge Balance

## Summary
- Added `contractPendingResponseCount` to admin dashboard summary model.
- Contract queue badge total/watch now includes pending-response contracts in addition to decision queue.
- Added regression guard across summary type, summary aggregation, and `/admin` badge formula.

## Scope
- `src/app/admin/page-dashboard-types.ts`
- `src/app/admin/page-summary-helpers.ts`
- `src/app/admin/page.tsx`
- `scripts/tests/e2e-wi0847-admin-dashboard-contract-pending-response-queue-badge-balance.test.ts` (new)

## Acceptance
1. Admin summary model exposes `contractPendingResponseCount`.
2. Contracts summary aggregation counts `SENT` docs into pending-response count.
3. `/admin` contract queue badge total/watch includes decision queue + pending response.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0847-admin-dashboard-contract-pending-response-queue-badge-balance.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0804-admin-dashboard-core-queue-badge-upgrade.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
