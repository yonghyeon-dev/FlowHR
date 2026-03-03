# WI-0813 Admin Dashboard Summary Split + Benefits Deeplink Auto-Load

## Summary
- Split admin dashboard summary calculation logic out of `src/app/admin/page.tsx` into dedicated helper/types files.
- Reduced `src/app/admin/page.tsx` line count from 445 to 335 to keep buffer below 500 risk (and under existing 360 regression threshold).
- Improved admin benefits workspace product flow:
  - apply deep-link query filters (`status`, `risk`, `q`) on route load/update
  - one-shot auto-load once session context is ready

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-summary-helpers.ts` (new)
- `src/app/admin/page-dashboard-types.ts` (new)
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `scripts/tests/e2e-wi0813-admin-dashboard-summary-split-and-benefits-deeplink-autoload.test.ts` (new)

## Acceptance
1. Admin dashboard page stays below 360 lines and still renders existing priority/queue hub UX.
2. Dashboard summary metrics are computed through extracted helper without behavior change.
3. Admin benefits workspace reads query params and auto-loads data once session context becomes available.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0665-admin-dashboard-priority-focus-cards-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0784-admin-dashboard-hub-ia-simplification.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0804-admin-dashboard-core-queue-badge-upgrade.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0523-admin-benefits-over-limit-risk-filter-and-summary.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0536-admin-benefits-pending-aging-risk-summary.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0813-admin-dashboard-summary-split-and-benefits-deeplink-autoload.test.ts`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`

## Notes
- This WI is a targeted split for admin page growth control plus a direct core-journey improvement on benefits admin workspace.
