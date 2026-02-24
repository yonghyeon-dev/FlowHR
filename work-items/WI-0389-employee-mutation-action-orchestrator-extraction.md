# WI-0389: Employee mutation action orchestrator extraction

## Summary
- Extracted employee self-service mutation/snapshot orchestration from `src/app/employee/page.tsx` into `src/app/employee/page-mutation-actions.ts`.
- Moved the following action flows behind a dedicated builder:
  - snapshot refresh
  - attendance create / checkout-now / correction request
  - leave create / cancel
- Kept low-level request contracts in `page-action-helpers.ts`, while page-level wiring now delegates through `mutationActions`.
- Reduced `src/app/employee/page.tsx` size from 1150 lines to 1063 lines.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-mutation-actions.ts`
- `scripts/tests/e2e-wi0389-employee-mutation-action-orchestrator-extraction.test.ts`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0389-employee-mutation-action-orchestrator-extraction.test.ts`
- `npm.cmd run -s typecheck`
