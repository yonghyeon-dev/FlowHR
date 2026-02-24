# WI-0312: Payroll Service Modular Split Phase 10 (Year-End Settlement Helpers)

## Background

`src/features/payroll/service.ts` still contains dense year-end settlement
tax/withholding math. This logic is computation-heavy and better isolated in
the payroll calculation helper module for maintainability.

## Scope

- Move year-end settlement computation from `service.ts` into:
  - `src/features/payroll/year-end-calculation-helpers.ts`
- Keep `service.ts` as orchestration/wrapper with ServiceError boundary.
- Add WI-0312 regression test coverage.

## Out of Scope

- API/schema/contract changes
- New year-end settlement features
- UI changes

## Acceptance

1. `service.ts` delegates settlement math to helper module.
2. Existing settlement behavior and validation semantics remain unchanged.
3. WI-0312 regression and build checks pass.

## Notes

- Related issue: `#393`
- Structural decomposition WI (backend-only)
