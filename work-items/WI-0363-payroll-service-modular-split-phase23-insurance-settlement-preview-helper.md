# WI-0363: Payroll service modular split phase23 (insurance settlement preview helper)

## Summary
- Extracted `previewPayrollInsuranceSettlement` execution flow into `service-insurance-settlement-preview-helpers.ts`.
- Moved permission/feature-flag guard, computation, rounding math, audit, and event payload composition to helper module.
- Rewired `service.ts` endpoint wrapper to delegate fully to helper and shrink service footprint.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-insurance-settlement-preview-helpers.ts`
- `scripts/tests/e2e-wi0363-payroll-service-modular-split-phase23-insurance-settlement-preview-helper.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0363-payroll-service-modular-split-phase23-insurance-settlement-preview-helper.test.ts`
- `npm.cmd run -s typecheck`

