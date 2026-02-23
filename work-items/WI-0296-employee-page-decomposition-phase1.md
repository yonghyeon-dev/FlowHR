# WI-0296: Employee Self-Service Page Decomposition Phase 1

## Background

`src/app/employee/page.tsx` remained oversized and difficult to maintain.
To reduce bloat without product-scope drift, this WI applies structure-only decomposition.

## Scope

- Extract local type aliases into:
  - `src/app/employee/page-types.ts`
- Extract pure utility helpers into:
  - `src/app/employee/page-helpers.ts`
- Rewire `src/app/employee/page.tsx` to import extracted modules.

## Out of Scope

- New self-service UI sections/features
- API contract or schema changes
- Ops/scheduler/workflow additions

## Acceptance

1. `src/app/employee/page.tsx` behavior remains unchanged.
2. Local type/helper declarations are moved to dedicated modules.
3. Regression checks pass for employee/admin/payroll baseline paths.

## Notes

- Related issue: `#361`
- Refactor-only WI (no contract version bump required)
