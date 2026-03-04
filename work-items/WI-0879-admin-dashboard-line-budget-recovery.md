# WI-0879 Admin Dashboard Line Budget Recovery

## Summary
- Recovered `src/app/admin/page.tsx` line budget from 423 to 331 lines.
- Extracted queue badge construction to `page-queue-badges.ts` while preserving dashboard IA and source-context links.
- Kept top-priority card and workspace-hub rendering behavior unchanged.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/page-queue-badges.ts` (new)
- `scripts/tests/e2e-wi0879-admin-dashboard-line-budget-recovery.test.ts` (new)

## Acceptance
1. `/admin` remains summary-first hub with top-priority and workspace hub panels.
2. Queue badge links still open approval/payroll/contracts with `source=admin-dashboard`.
3. `src/app/admin/page.tsx` stays at or below 360 lines.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0784-admin-dashboard-hub-ia-simplification.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0813-admin-dashboard-summary-split-and-benefits-deeplink-autoload.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0879-admin-dashboard-line-budget-recovery.test.ts`
