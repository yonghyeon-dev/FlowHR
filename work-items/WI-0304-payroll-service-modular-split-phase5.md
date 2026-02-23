# WI-0304: Payroll Service Modular Split Phase 5

## Background

`src/features/payroll/service.ts` still contained year-end filing ack catalog
constants and ack payload normalization logic inline. This block can be
isolated without behavior change and is a suitable next split target after
WI-0302.

## Scope

- Add:
  - `src/features/payroll/year-end-filing-ack-catalog-helpers.ts`
- Rewire `src/features/payroll/service.ts` to delegate:
  - filing ack catalog builder
  - filing ack payload resolver
- Remove inlined ack catalog constants/validation logic from `service.ts`

## Out of Scope

- Payroll behavior changes
- API/contract/schema changes
- UI changes

## Acceptance

1. Ack catalog and ack payload normalization logic are centralized in helper module.
2. `service.ts` line count decreases with behavior preserved.
3. Typecheck/build/regression checks pass.

## Notes

- Related issue: `#377`
- Refactor-only WI (no contract version bump required)
