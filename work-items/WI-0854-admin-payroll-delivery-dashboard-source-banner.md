# WI-0854 Admin Payroll Delivery Dashboard Source Banner

## Summary
- Added direct `/admin/payroll-payslip-delivery` shortcut in admin payroll queue badge for undistributed runs.
- Added dashboard source-entry banner in payslip delivery workspace with focused queue label.
- Extended payslip delivery locale copy for dashboard source messaging.

## Scope
- `src/app/admin/page.tsx`
- `src/components/payroll-payslip-delivery/PayrollPayslipDeliveryConsole.tsx`
- `src/components/payroll-payslip-delivery/copy.ts`
- `scripts/tests/e2e-wi0854-admin-payroll-delivery-dashboard-source-banner.test.ts` (new)

## Acceptance
1. Admin payroll queue badge includes undistributed delivery shortcut to `/admin/payroll-payslip-delivery`.
2. Payslip delivery workspace shows dashboard source banner when opened with `source=admin-dashboard`.
3. Existing distribution dry-run/apply behavior remains unchanged.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0854-admin-payroll-delivery-dashboard-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0853-admin-payroll-queue-dashboard-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0628-admin-payroll-close-delivery-session-context-productization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0715-payroll-session-context-strict-devtools-gate.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
