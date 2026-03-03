# WI-0828 Admin Benefits Pending Aging Risk Filter and Dashboard Hub Deeplink

## Summary
- Added `pending_3d` risk filter support to admin benefits workspace request queue.
- Wired admin benefits risk filter UI option and locale copy so admins can isolate long-pending requests.
- Updated admin dashboard workspace hub communication links to open risk-focused queues for notices, benefits, and recruitment.

## Scope
- `src/components/benefits/admin-benefits-workspace-helpers.ts`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
- `src/components/benefits/copy.ts`
- `src/app/admin/page-workspace-hubs.ts`
- `scripts/tests/e2e-wi0828-admin-benefits-pending-aging-risk-filter-and-dashboard-hub-deeplink.test.ts` (new)

## Acceptance
1. `/admin/benefits` supports `risk=pending_3d` and applies long-pending submitted-request filtering.
2. Admin benefits risk filter selector exposes all/over-limit/pending-3d options with localized copy.
3. Admin dashboard communication hub links open risk-targeted queues for notices, benefits, and recruitment.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0828-admin-benefits-pending-aging-risk-filter-and-dashboard-hub-deeplink.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0523-admin-benefits-over-limit-risk-filter-and-summary.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0536-admin-benefits-pending-aging-risk-summary.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0813-admin-dashboard-summary-split-and-benefits-deeplink-autoload.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
