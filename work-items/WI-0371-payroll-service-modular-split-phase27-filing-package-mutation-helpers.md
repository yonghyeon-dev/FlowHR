# WI-0371: Payroll service modular split phase27 (filing package mutation helpers)

## Summary
- Extracted filing package mutation flows into `service-year-end-filing-package-mutation-helpers.ts`.
- Moved acknowledge/cancel/reopen validation, actor metadata, audit/event payload composition, and submission-target loading from `service.ts`.
- Rewired `acknowledgePayrollYearEndFilingPackage`, `cancelPayrollYearEndFilingPackage`, and `reopenPayrollYearEndFilingPackage` wrappers to delegate to helper functions.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-year-end-filing-package-mutation-helpers.ts`
- `scripts/tests/e2e-wi0371-payroll-service-modular-split-phase27-filing-package-mutation-helpers.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0371-payroll-service-modular-split-phase27-filing-package-mutation-helpers.test.ts`
- `npm.cmd run -s typecheck`
