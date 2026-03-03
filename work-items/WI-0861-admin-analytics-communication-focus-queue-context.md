# WI-0861 Admin Analytics Communication Focus Queue Context

## Summary
- Extended admin analytics communication KPI links (notices/benefits/recruitment) to include `focusMetric` with `source=admin-analytics`.
- Added focused queue hint resolution in destination admin workspaces so analytics entry shows source plus queue context.
- Recovered broken Korean runtime text in admin recruitment source hint and default employment type value.

## Scope
- `src/components/admin-kpi/AdminNoticesKpiPanel.tsx`
- `src/components/admin-kpi/AdminBenefitsKpiPanel.tsx`
- `src/components/admin-kpi/AdminRecruitmentKpiPanel.tsx`
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `scripts/tests/e2e-wi0861-admin-analytics-communication-focus-queue-context.test.ts` (new)

## Acceptance
1. Analytics communication panel priority/quick links include both `source=admin-analytics` and route-specific `focusMetric`.
2. `/admin/notices`, `/admin/benefits`, `/admin/recruitment` show source-entry hint with focused queue label for analytics-origin entries.
3. Existing status/risk/stage filter hydration and auto-load behavior remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0861-admin-analytics-communication-focus-queue-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0860-admin-analytics-communication-kpi-source-context-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0859-admin-communication-hub-source-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0829-admin-analytics-benefits-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0824-admin-analytics-recruitment-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0812-admin-analytics-notice-priority-action-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
