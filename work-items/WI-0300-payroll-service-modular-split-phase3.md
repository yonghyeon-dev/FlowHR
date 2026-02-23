# WI-0300: Payroll Service Modular Split Phase 3

## Background

`src/features/payroll/service.ts` remains a high-risk large file.
This WI continues decomposition by extracting KR statutory tax/insurance normalization and calculation helpers.

## Scope

- Add:
  - `src/features/payroll/kr-statutory-helpers.ts`
- Rewire `src/features/payroll/service.ts` wrappers for:
  - income-tax bracket/lookup normalization
  - statutory income split normalization
  - progressive/lookup income-tax calculation
  - insurance rounding/cap/rounding-rule helpers

## Out of Scope

- New payroll behavior
- API/contract changes
- UI changes

## Acceptance

1. Existing payroll statutory calculations remain behavior-compatible.
2. Helper logic is isolated from monolithic service file.
3. Typecheck, payroll regressions, and build pass.

## Notes

- Related issue: `#369`
- Refactor-only WI (no contract version bump required)
