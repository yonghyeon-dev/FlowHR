# WI-0894 Admin Root Production Session Gate Alignment

## Summary
- Aligned `/admin` root dashboard with the same product-mode login-session gate pattern used in approval/employee surfaces.
- Restricted admin root API helper header fallback (`x-actor-*`) to `showDevTools || !isProductionRuntime`.
- Updated dashboard refresh gate/notice to use `requiresLoginSession` and blocked refresh actions in production when bearer session is missing.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-api-helpers.ts`
- `scripts/tests/e2e-wi0894-admin-root-production-session-gate-alignment.test.ts` (new)

## Acceptance
1. In production runtime with devtools disabled and no bearer session, `/admin` root refresh is blocked and `/login` guidance is shown.
2. Admin root API helper sends `x-actor-*` headers only when devtools mode is enabled or runtime is non-production.
3. Existing `/admin` dashboard line budget remains within existing guard thresholds.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0374-admin-runtime-locale-and-api-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0879-admin-dashboard-line-budget-recovery.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0894-admin-root-production-session-gate-alignment.test.ts`
- `npm.cmd run build`
