# WI-0859 Admin Communication Hub Source Context

## Summary
- Added `source=admin-dashboard` context to admin dashboard communication hub links for notices, benefits, and recruitment queues.
- Added source-entry hints in each destination admin workspace header when opened from the dashboard.
- Preserved existing filter/query behavior and devtools log gating.

## Scope
- `src/app/admin/page-workspace-hubs.ts`
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `src/components/notices/AdminNoticeWorkspaceView.tsx`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx`
- `scripts/tests/e2e-wi0859-admin-communication-hub-source-context.test.ts` (new)

## Acceptance
1. Admin communication hub links to notices/benefits/recruitment include `source=admin-dashboard`.
2. Destination workspace headers show source-entry hint only for dashboard-source route entries.
3. Existing queue filters and data load behavior remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0859-admin-communication-hub-source-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0828-admin-benefits-pending-aging-risk-filter-and-dashboard-hub-deeplink.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0836-admin-dashboard-contract-risk-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
