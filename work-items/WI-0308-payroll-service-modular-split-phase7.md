# WI-0308: Payroll Service Modular Split Phase 7

## Background

`src/features/payroll/service.ts` is still a high-growth file. After WI-0306 and
WI-0307, filing submission lifecycle helpers (summary/log query/pending guard/id
builder) remained in `service.ts`.

## Scope

- Add `src/features/payroll/year-end-filing-submission-lifecycle-helpers.ts`.
  - move filing lifecycle audit log listing helper
  - move filing submission summaries-from-audit helper
  - move pending-submission guard helper
  - move filing submission ID builder helper
- Rewire `src/features/payroll/service.ts` to use the new helper module.
  - replace local helper definitions with imports
  - switch filing submission/log query call sites to `context.dataAccess.audit` helper calls
- Keep behavior unchanged (internal modularization only).

## Out of Scope

- API/schema/contract changes
- Feature expansion
- UI changes

## Acceptance

1. Submission lifecycle helper functions are extracted from `service.ts` into a dedicated helper file.
2. `service.ts` references the new helper module and no longer defines those local helpers.
3. Regression/build/typecheck/contract checks pass.

## Notes

- Related issue: `#385`
- Internal decomposition WI focused on file-size pressure reduction
