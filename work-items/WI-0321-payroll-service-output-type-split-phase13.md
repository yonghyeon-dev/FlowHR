# WI-0321: Payroll Service Output Type Split Phase 13

## Background

`src/features/payroll/service.ts` kept large output/result type blocks inline
even after prior helper extractions. The file size continued to grow and made
core payroll flow changes harder to review.

## Scope

- Add `src/features/payroll/service-output-types.ts`.
- Move payroll service output/result type declarations into the new file.
- Rewire `src/features/payroll/service.ts` to import moved types.
- Keep runtime behavior unchanged.
- Add WI-0321 regression coverage.

## Out of Scope

- Payroll rule or calculation logic changes
- API/schema/contract changes
- New payroll features

## Acceptance

1. Payroll service imports output/result types from `service-output-types.ts`.
2. Moved type declarations are removed from `service.ts`.
3. `service.ts` line count is reduced while behavior remains unchanged.
4. WI-0321 regression and type/build checks pass.

## Notes

- Related issue: `#411`
- Payroll decomposition WI (type-layer extraction only)
