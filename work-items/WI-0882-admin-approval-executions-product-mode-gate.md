# WI-0882 Admin Approval Executions Product-Mode Gate

## Summary
- Applied product-mode auth guard to `/admin/approval-executions`.
- In production with devtools disabled, bearer login session is now required and actor-header fallback is blocked.
- Preserved existing devtools-only advanced logs and related-workspaces split behavior.

## Scope
- `src/app/admin/approval-executions/page.tsx`
- `scripts/tests/e2e-wi0882-admin-approval-executions-product-mode-gate.test.ts` (new)

## Acceptance
1. `production + !showDevTools + !usesBearerToken` shows login-session guidance and blocks action requests.
2. Header-based actor fallback remains available only for devtools or non-production runtime.
3. Existing approval-executions product UX guards continue to pass.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0626-admin-approval-pages-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0643-admin-approval-executions-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0882-admin-approval-executions-product-mode-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0856-admin-approval-dashboard-open-link-stalled-filter-fix.test.ts`
- `npm.cmd run build`
