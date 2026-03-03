# WI-0855 Admin Dashboard Queue Open Source Context Links

## Summary
- Added `source=admin-dashboard` context to core queue badge default open links in `/admin`.
- Queue open action now preserves source context for approval, payroll-close, and contracts workspaces.
- Reused existing source banners in destination workspaces without additional UX surfaces.

## Scope
- `src/app/admin/page.tsx`
- `scripts/tests/e2e-wi0855-admin-dashboard-queue-open-source-context-links.test.ts` (new)

## Acceptance
1. Admin queue badge open links include dashboard source context query.
2. Approval/payroll/contracts destination pages can recognize dashboard source context.
3. Existing queue sub-actions and counts remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0855-admin-dashboard-queue-open-source-context-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0854-admin-payroll-delivery-dashboard-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0853-admin-payroll-queue-dashboard-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0852-admin-approval-queue-dashboard-deeplink-hydration.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
