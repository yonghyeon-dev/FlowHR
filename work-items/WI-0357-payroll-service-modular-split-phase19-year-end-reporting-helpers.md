# WI-0357: Payroll service modular split phase19 (year-end reporting helpers)

## Summary
- Split year-end reporting flows from `service.ts` into a dedicated helper module.
- Moved insurance reconciliation report and preflight checklist logic into `service-year-end-reporting-helpers.ts`.
- Rewired `service.ts` to delegate both endpoints to helper functions with no behavior change.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-year-end-reporting-helpers.ts`
- `scripts/tests/e2e-wi0357-payroll-service-modular-split-phase19-year-end-reporting-helpers.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0357-payroll-service-modular-split-phase19-year-end-reporting-helpers.test.ts`
