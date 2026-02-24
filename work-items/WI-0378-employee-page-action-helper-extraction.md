# WI-0378: Employee page action helper extraction

## Summary
- Extracted employee self-service action handlers into `src/app/employee/page-action-helpers.ts`.
- Moved refresh snapshot and attendance/leave mutation API flow parsing from `src/app/employee/page.tsx` into helper functions.
- Rewired page action wrappers to delegate to helper functions while preserving existing state updates and UX flow.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-action-helpers.ts`
- `scripts/tests/e2e-wi0378-employee-page-action-helper-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0378-employee-page-action-helper-extraction.test.ts`
- `npm.cmd run -s typecheck`
