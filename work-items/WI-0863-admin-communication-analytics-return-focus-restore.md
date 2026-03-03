# WI-0863 Admin Communication Analytics Return Focus Restore

## Summary
- Extended analytics source context links in communication KPI panels to carry `analyticsFocus` from the current analytics focus state.
- Restored analytics focus when returning from `/admin/notices`, `/admin/benefits`, and `/admin/recruitment` via the header return action.
- Kept existing queue-focused `focusMetric` routing and source hint behavior unchanged.

## Scope
- `src/components/admin-kpi/AdminKpiDashboard.tsx`
- `src/components/admin-kpi/AdminNoticesKpiPanel.tsx`
- `src/components/admin-kpi/AdminBenefitsKpiPanel.tsx`
- `src/components/admin-kpi/AdminRecruitmentKpiPanel.tsx`
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `scripts/tests/e2e-wi0863-admin-communication-analytics-return-focus-restore.test.ts` (new)
- `scripts/tests/e2e-wi0860-admin-analytics-communication-kpi-source-context-links.test.ts` (updated)
- `scripts/tests/e2e-wi0861-admin-analytics-communication-focus-queue-context.test.ts` (updated)
- `scripts/tests/e2e-wi0862-admin-communication-analytics-return-action.test.ts` (updated)

## Acceptance
1. Analytics communication KPI links append `analyticsFocus` when the selected analytics focus is not `all`.
2. Communication workspaces parse `analyticsFocus` safely and compute return href as `/admin/analytics?focus=<metric>` when valid.
3. Existing `source=admin-analytics` + `focusMetric` queue context behavior remains intact.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0863-admin-communication-analytics-return-focus-restore.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0862-admin-communication-analytics-return-action.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0861-admin-analytics-communication-focus-queue-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0860-admin-analytics-communication-kpi-source-context-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
