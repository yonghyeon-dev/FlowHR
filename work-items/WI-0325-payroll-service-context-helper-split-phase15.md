# WI-0325: Payroll Service Context Helper Split Phase 15

## Background

`src/features/payroll/service.ts` still contained service-context boilerplate
for permission/event publisher helpers, increasing top-level monolith size and
cross-cutting noise.

## Scope

- Extract service-context helper block from `service.ts` into
  `src/features/payroll/service-context-helpers.ts`:
  - `ServiceContext` type
  - `getEventPublisher`
  - `requirePayrollPermission`
  - `requireDeductionProfilePermission`
- Rewire `service.ts` imports and remove duplicated local definitions.
- Add WI-0325 regression coverage.

## Out of Scope

- Payroll behavior/domain logic changes
- API/schema/contract changes
- Permission policy changes

## Acceptance

1. `service.ts` imports context helpers from new module and no longer declares
   the extracted helpers locally.
2. Context helper module exports required type/functions.
3. WI-0325 regression and build checks pass.

## Notes

- Related issue: `#419`
- Internal decomposition only (no contract bump)
