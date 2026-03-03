# WI-0852 Admin Approval Queue Dashboard Deeplink Hydration

## Summary
- Added approval queue quick links in `/admin` dashboard queue badge for pending and stalled follow-up.
- Hydrated `/admin/approval-executions` filter state from query params (`state`, `sort`, `stalledHoursMin`, `limit`) on first render.
- Added dashboard source-entry banner in approval queue workspace to clarify focused queue context.

## Scope
- `src/app/admin/page.tsx`
- `src/app/admin/approval-executions/page.tsx`
- `scripts/tests/e2e-wi0852-admin-approval-queue-dashboard-deeplink-hydration.test.ts` (new)

## Acceptance
1. Admin dashboard approval queue badge exposes direct pending/stalled quick links.
2. `/admin/approval-executions` initializes filters from deeplink query parameters.
3. Approval queue page shows dashboard source banner when opened from admin dashboard links.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0852-admin-approval-queue-dashboard-deeplink-hydration.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0851-admin-contracts-dashboard-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0850-admin-dashboard-contract-queue-breakdown-quick-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
