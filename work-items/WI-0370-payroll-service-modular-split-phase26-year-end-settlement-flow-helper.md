# WI-0370: Payroll service modular split phase26 (year-end settlement flow helper)

## Summary
- Extracted year-end settlement preview/recalculation/finalization flows into `service-year-end-settlement-flow-helpers.ts`.
- Moved settlement validation, deduction-cap application, hash guard, audit/event payload composition out of `service.ts`.
- Rewired `previewPayrollYearEndSettlement`, `recalculatePayrollYearEndSettlement`, and `finalizePayrollYearEndSettlement` wrappers to delegate to helpers.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-year-end-settlement-flow-helpers.ts`
- `scripts/tests/e2e-wi0370-payroll-service-modular-split-phase26-year-end-settlement-flow-helper.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0370-payroll-service-modular-split-phase26-year-end-settlement-flow-helper.test.ts`
- `npm.cmd run -s typecheck`
