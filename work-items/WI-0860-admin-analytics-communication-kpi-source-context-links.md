# WI-0860 Admin Analytics Communication KPI Source Context Links

## Summary
- Added `source=admin-analytics` context to admin analytics communication KPI links for notices, benefits, and recruitment panels.
- Extended destination admin workspaces to show source-entry hints when opened from analytics.
- Preserved existing risk/status filter hydration and queue behavior.

## Scope
- `src/components/admin-kpi/AdminNoticesKpiPanel.tsx`
- `src/components/admin-kpi/AdminBenefitsKpiPanel.tsx`
- `src/components/admin-kpi/AdminRecruitmentKpiPanel.tsx`
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `scripts/tests/e2e-wi0860-admin-analytics-communication-kpi-source-context-links.test.ts` (new)

## Acceptance
1. Notices/benefits/recruitment KPI priority + quick links in `/admin/analytics` include `source=admin-analytics`.
2. `/admin/notices`, `/admin/benefits`, `/admin/recruitment` show source-entry hints for analytics-origin entries.
3. Existing queue filters and one-shot auto-load behavior remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0860-admin-analytics-communication-kpi-source-context-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0859-admin-communication-hub-source-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0829-admin-analytics-benefits-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0824-admin-analytics-recruitment-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0812-admin-analytics-notice-priority-action-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
