# WI-0309: Payroll Service Modular Split Phase 8 (Runtime Helper Extraction)

## Background

`src/features/payroll/service.ts` still included repeated runtime utility
implementations (feature-flag resolution, period/rate/integer validation, and
Seoul datetime boundary helpers). This utility cluster is cross-cutting and can
be extracted without behavior changes.

## Scope

- Add `src/features/payroll/service-runtime-helpers.ts`.
  - move payroll feature-flag resolver helpers
  - move period validation helpers
  - move KRW/rate validator helpers
  - move Seoul datetime formatting/boundary helpers
- Rewire `src/features/payroll/service.ts` to import and reuse these helpers.
- Keep behavior unchanged (internal modularization only).

## Out of Scope

- API/schema/contract changes
- UI changes
- New payroll business rules

## Acceptance

1. Runtime utility helpers are extracted from `service.ts` into
   `service-runtime-helpers.ts`.
2. `service.ts` consumes imported helpers and no longer defines duplicated
   runtime utility implementations inline.
3. Regression/build/typecheck checks pass.

## Notes

- Related issue: `#387`
- Internal decomposition WI focused on file-size pressure reduction
