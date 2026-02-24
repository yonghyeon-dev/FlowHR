# WI-0381: Payroll service modular split phase30 (preview helpers)

## Summary
- Extracted payroll preview and deduction-preview flows into `service-preview-helpers.ts`.
- Moved payroll run creation, deduction profile/statutory calculation, and audit/event publishing out of `service.ts`.
- Rewired `service.ts` wrappers for:
  - `previewPayroll`
  - `previewPayrollWithDeductions`

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-preview-helpers.ts`
- `scripts/tests/e2e-wi0381-payroll-service-modular-split-phase30-preview-helpers.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0381-payroll-service-modular-split-phase30-preview-helpers.test.ts`
- `npm.cmd run -s typecheck`
