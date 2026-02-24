# WI-0358: Payroll service modular split phase20 (deduction profile helpers)

## Summary
- Split deduction profile read/write/list flows from `service.ts` into a dedicated helper module.
- Added `service-deduction-profile-helpers.ts` and delegated three deduction-profile endpoints from `service.ts`.
- Preserved audit/event payload behavior while reducing top-level service size.

## Scope
- `src/features/payroll/service.ts`
- `src/features/payroll/service-deduction-profile-helpers.ts`
- `scripts/tests/e2e-wi0358-payroll-service-modular-split-phase20-deduction-profile-helpers.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0358-payroll-service-modular-split-phase20-deduction-profile-helpers.test.ts`
