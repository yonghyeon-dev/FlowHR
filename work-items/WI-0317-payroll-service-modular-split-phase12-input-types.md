# WI-0317: Payroll Service Modular Split Phase 12 (Input Types Extraction)

## Background

`src/features/payroll/service.ts` still held a large input/request type block
for payroll preview, year-end filing, and deduction profile flows. The type
definitions increased file density and made service orchestration harder to
navigate.

## Scope

- Extract service input/request type definitions from `service.ts` into:
  - `src/features/payroll/service-input-types.ts`
- Rewire `service.ts` to import extracted types without behavior changes.
- Add WI-0317 regression coverage.

## Out of Scope

- API/schema/contract changes
- New payroll features or rule changes
- UI changes

## Acceptance

1. `service.ts` imports major input/request types from `service-input-types.ts`.
2. Extracted type block is removed from `service.ts`.
3. WI-0317 regression and build checks pass.

## Notes

- Related issue: `#403`
- Structural decomposition WI (backend-only)
