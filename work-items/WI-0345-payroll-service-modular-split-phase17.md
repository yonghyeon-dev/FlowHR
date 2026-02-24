# WI-0345: Payroll service modular split phase17

## Summary
- Extended payroll year-end adapter extraction by moving filing timeline/withholding receipt wrappers.
- Rewired `service.ts` to use adapter helpers instead of direct core-helper calls.
- Continued shrinking service orchestration surface without changing outcomes.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-year-end-adapter-helpers.ts`
- `scripts/tests/e2e-wi0345-payroll-service-modular-split-phase17.test.ts` (new)
- `ROADMAP.md`

## Notes
- Service modularization only; no API behavior changes.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0345-payroll-service-modular-split-phase17.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0326-payroll-service-computation-helper-split-phase16.test.ts`
- `npm.cmd run -s typecheck`
