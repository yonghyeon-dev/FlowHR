# WI-0372: Payroll service modular split phase28 (filing export helper)

## Summary
- Extracted year-end filing export flow into `service-year-end-filing-export-helpers.ts`.
- Moved finalization guard checks, settlement-hash validation, filing record validation/artifact generation, and export audit/event publishing from `service.ts`.
- Rewired `exportPayrollYearEndFilingData` wrapper in `service.ts` to delegate to helper.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-year-end-filing-export-helpers.ts`
- `scripts/tests/e2e-wi0372-payroll-service-modular-split-phase28-filing-export-helper.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0372-payroll-service-modular-split-phase28-filing-export-helper.test.ts`
- `npm.cmd run -s typecheck`
