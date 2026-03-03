# WI-0862 Admin Communication Analytics Return Action

## Summary
- Added return-to-analytics action in admin communication workspaces when entered from analytics source context.
- Kept existing source hints and queue context labels while improving round-trip navigation back to `/admin/analytics`.
- Applied the same behavior to notices, benefits, and recruitment admin workspaces.

## Scope
- `src/components/notices/AdminNoticeWorkspace.tsx`
- `src/components/notices/AdminNoticeWorkspaceView.tsx`
- `src/components/benefits/AdminBenefitsWorkspace.tsx`
- `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx`
- `scripts/tests/e2e-wi0862-admin-communication-analytics-return-action.test.ts` (new)

## Acceptance
1. For `source=admin-analytics`, each communication workspace computes analytics return href and localized action label.
2. Header actions render “분석으로 돌아가기 / Back to analytics” only when analytics source context exists.
3. Existing workspace links and queue filter hydration remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0862-admin-communication-analytics-return-action.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0861-admin-analytics-communication-focus-queue-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0860-admin-analytics-communication-kpi-source-context-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0859-admin-communication-hub-source-context.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
