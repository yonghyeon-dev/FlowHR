# WI-0856 Admin Approval Dashboard Open Link Stalled Filter Fix

## Summary
- Fixed `/admin/approval-executions` dashboard-entry hydration so queue open links do not implicitly force stalled-only filtering.
- When opened from `source=admin-dashboard` without explicit `stalledHoursMin`, the page now normalizes to `0` (pending queue view).
- Preserved stalled risk semantics in summary/list badges by applying a 24h baseline when threshold is unset or zero.

## Scope
- `src/app/admin/approval-executions/page.tsx`
- `scripts/tests/e2e-wi0856-admin-approval-dashboard-open-link-stalled-filter-fix.test.ts` (new)

## Acceptance
1. Admin dashboard entry without explicit `stalledHoursMin` opens pending queue behavior (non-stalled-only implicit filter removed).
2. Stalled risk summary/list chips still use a meaningful baseline (24h) when threshold is `0`.
3. Existing hydration path with explicit `stalledHoursMin` continues to work unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0856-admin-approval-dashboard-open-link-stalled-filter-fix.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0855-admin-dashboard-queue-open-source-context-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0852-admin-approval-queue-dashboard-deeplink-hydration.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
