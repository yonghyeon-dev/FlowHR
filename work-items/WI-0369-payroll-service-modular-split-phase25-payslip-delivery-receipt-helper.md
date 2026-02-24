# WI-0369: Payroll service modular split phase25 (payslip delivery/receipt helper)

## Summary
- Extracted payslip distribution and receipt acknowledgement flows into `service-payslip-period-helpers.ts`.
- Moved delivery preview/apply, receipt authorization/guard, audit/event payload composition to helper.
- Rewired `distributePayrollPayslips` and `acknowledgePayrollPayslipReceipt` wrappers in `service.ts`.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-payslip-period-helpers.ts`
- `scripts/tests/e2e-wi0369-payroll-service-modular-split-phase25-payslip-delivery-receipt-helper.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0369-payroll-service-modular-split-phase25-payslip-delivery-receipt-helper.test.ts`
- `npm.cmd run -s typecheck`

