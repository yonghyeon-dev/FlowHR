# WI-0302: Payroll Service Modular Split Phase 4

## Background

`src/features/payroll/service.ts` still holds a large year-end filing lifecycle
summary/timeline block. This WI continues decomposition to reduce file size and
isolate lifecycle parsing/building logic.

## Scope

- Add:
  - `src/features/payroll/year-end-filing-lifecycle-helpers.ts`
- Rewire `src/features/payroll/service.ts` to delegate:
  - year-end filing submission summary construction
  - year-end filing submission timeline construction
- Remove inlined lifecycle builder implementations from `service.ts`

## Out of Scope

- Payroll behavior changes
- API/contract/schema changes
- UI changes

## Acceptance

1. Filing lifecycle summary/timeline logic is centralized in helper module.
2. `service.ts` line count decreases without behavior regressions.
3. Typecheck/build/regression checks pass.

## Notes

- Related issue: `#373`
- Refactor-only WI (no contract version bump required)
