# WI-0850 Admin Dashboard Contract Queue Breakdown Quick Links

## Summary
- Added contract queue breakdown quick links in `/admin` queue badge card.
- Each contract subcount now opens its dedicated filtered queue route directly from dashboard.
- Kept existing queue totals/risk counters intact while improving first-action speed.

## Scope
- `src/app/admin/page.tsx`
- `scripts/tests/e2e-wi0850-admin-dashboard-contract-queue-breakdown-quick-links.test.ts` (new)

## Acceptance
1. Contract badge exposes quick links for decision queue, pending response, and SLA overdue.
2. Quick links open `/admin/contracts` with respective filter query (`decisionQueueOnly`, `status=SENT`, `slaRisk=OVERDUE`) and source context.
3. Existing queue badge totals and breakdown labels remain unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0850-admin-dashboard-contract-queue-breakdown-quick-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0849-admin-dashboard-contract-queue-subcount-korean-terminology-lock.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0848-admin-dashboard-contract-queue-subcount-annotation.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
