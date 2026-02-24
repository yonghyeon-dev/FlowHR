# WI-0362: Payroll service modular split phase22 (statutory deduction preview helper)

## Summary
- Extracted the `statutory_kr_baseline` branch of `previewPayrollWithDeductions` into a dedicated helper.
- Added `service-deduction-statutory-preview-helpers.ts` to encapsulate KR baseline tax/insurance lookup and breakdown composition.
- Rewired `service.ts` to delegate statutory deduction computation through helper output, reducing service density.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-deduction-statutory-preview-helpers.ts`
- `scripts/tests/e2e-wi0362-payroll-service-modular-split-phase22-statutory-deduction-preview-helper.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0362-payroll-service-modular-split-phase22-statutory-deduction-preview-helper.test.ts`
- `npm.cmd run -s typecheck`

