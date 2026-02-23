# WI-0295: Core File Decomposition Phase 1 (Payroll Service + Admin Page)

## Background

Three oversized core files were blocking maintainability:

- `src/features/payroll/service.ts` (continued growth risk)
- `src/app/admin/page.tsx` (large monolithic page)
- `src/app/employee/page.tsx` (large monolithic page, deferred to next WI)

This WI starts decomposition on the highest-risk backend file and one admin entry page without changing product behavior.

## Scope

- Payroll year-end helper extraction from `src/features/payroll/service.ts`:
  - `src/features/payroll/year-end-calculation-helpers.ts`
  - `src/features/payroll/year-end-filing-artifact-helpers.ts`
  - `src/features/payroll/year-end-filing-submission-query-helpers.ts`
- Service-level wrapper wiring in `src/features/payroll/service.ts` to preserve existing call sites.
- Admin page utility/type extraction:
  - `src/app/admin/page-helpers.ts`
  - `src/app/admin/page-types.ts`
  - import rewiring in `src/app/admin/page.tsx`

## Out of Scope

- New payroll business rules
- New admin/employee UX sections
- `src/app/employee/page.tsx` decomposition beyond baseline compatibility

## Acceptance

1. `service.ts` keeps existing behavior while delegating year-end normalization, filing artifact generation, and submission query filtering/sorting to helper modules.
2. Admin dashboard page compiles and behavior remains unchanged after helper/type extraction.
3. Existing payroll/admin/employee regression tests pass.

## Notes

- Related issue: `#359`
- No API contract/schema changes
