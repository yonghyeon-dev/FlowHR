# WI-0298: Admin Page Decomposition Phase 1

## Background

`src/app/admin/page.tsx` remained oversized after WI-0295.
This WI continues decomposition by moving approval-queue derived/filter logic to a dedicated helper module.

## Scope

- Add:
  - `src/app/admin/page-queue-helpers.ts`
- Rewire `src/app/admin/page.tsx` to delegate:
  - wait-hour map derivation
  - SLA threshold normalization
  - attendance/leave/payroll queue filtering and sorting
  - queue search-sort row assembly/filtering

## Out of Scope

- New admin UX features
- API/contract schema changes
- Workflow or route additions

## Acceptance

1. Existing admin approval queue behavior remains unchanged.
2. Queue-derived logic is isolated from monolithic page file.
3. Typecheck, decomposition regression, and build pass.

## Notes

- Related issue: `#365`
- Refactor-only WI (no contract version bump required)
