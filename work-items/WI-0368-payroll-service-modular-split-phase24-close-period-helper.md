# WI-0368: Payroll service modular split phase24 (close period helper)

## Summary
- Extracted payroll close-period flow from `service.ts` into `service-payslip-period-helpers.ts`.
- Moved close preview/apply guard, delta computation, audit/event payload composition to helper.
- Rewired `closePayrollPeriod` wrapper in `service.ts` to delegate.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-payslip-period-helpers.ts`
- `scripts/tests/e2e-wi0368-payroll-service-modular-split-phase24-close-period-helper.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0368-payroll-service-modular-split-phase24-close-period-helper.test.ts`
- `npm.cmd run -s typecheck`

