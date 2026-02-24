# WI-0326: Payroll Service Computation Helper Split Phase 16

## Background

`src/features/payroll/service.ts` still contained payroll computation logic for
attendance split aggregation and gross-pay calculation. The block is reusable
and can be isolated to reduce monolith growth.

## Scope

- Extract payroll computation helper from `service.ts` into
  `src/features/payroll/service-computation-helpers.ts`:
  - `emptyPayrollComputationTotals`
  - `calculatePayrollComputation`
- Rewire `service.ts` imports and remove duplicated local definitions.
- Add WI-0326 regression coverage.

## Out of Scope

- Payroll formula/policy changes
- API/schema/contract changes
- Permission/auth flow changes

## Acceptance

1. `service.ts` imports `calculatePayrollComputation` from the new helper
   module and no longer declares local computation helper/totals constant.
2. Computation helper module exports both totals baseline and computation
   function.
3. WI-0326 regression and build checks pass.

## Notes

- Related issue: `#421`
- Internal decomposition only (no contract bump)
