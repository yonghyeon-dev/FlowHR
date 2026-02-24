# WI-0306: Payroll Service Modular Split Phase 6

## Background

`src/features/payroll/service.ts` still had inlined year-end finalization guard
and insurance reconciliation monthly-breakdown logic. This logic can be
isolated in a dedicated helper module without behavior changes.

## Scope

- Add:
  - `src/features/payroll/year-end-finalization-run-helpers.ts`
- Rewire `src/features/payroll/service.ts` to delegate:
  - year-end filing guard builder
  - year-end insurance reconciliation monthly breakdown builder
- Remove inlined implementations for these two helper blocks from `service.ts`

## Out of Scope

- Payroll behavior changes
- API/contract/schema changes
- UI changes

## Acceptance

1. Year-end finalization guard and monthly reconciliation aggregation logic are
   centralized in helper module.
2. `service.ts` line count decreases with behavior preserved.
3. Typecheck/build/regression checks pass.

## Notes

- Related issue: `#381`
- Refactor-only WI (no contract version bump required)
