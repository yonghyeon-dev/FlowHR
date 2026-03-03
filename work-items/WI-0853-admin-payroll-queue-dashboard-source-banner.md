# WI-0853 Admin Payroll Queue Dashboard Source Banner

## Summary
- Added payroll queue quick links in `/admin` dashboard badge for previewed and undistributed runs.
- Added source-entry banner in `/admin/payroll-close` when opened from dashboard queue links.
- Extended payroll-close locale copy with dashboard source and focused queue labels.

## Scope
- `src/app/admin/page.tsx`
- `src/components/payroll-close/PayrollClosePeriodConsole.tsx`
- `src/components/payroll-close/copy.ts`
- `scripts/tests/e2e-wi0853-admin-payroll-queue-dashboard-source-banner.test.ts` (new)

## Acceptance
1. Admin payroll badge exposes previewed and undistributed quick links with `source=admin-dashboard`.
2. Payroll close console shows dashboard source banner and focused queue label from query (`focus`).
3. Existing payroll close run preview/apply behavior remains unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0853-admin-payroll-queue-dashboard-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0628-admin-payroll-close-delivery-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0715-payroll-session-context-strict-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0852-admin-approval-queue-dashboard-deeplink-hydration.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
