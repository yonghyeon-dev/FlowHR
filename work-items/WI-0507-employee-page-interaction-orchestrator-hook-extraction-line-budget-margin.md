# WI-0507: Employee Page Interaction Orchestrator Hook Extraction Line Budget Margin

## Summary
- Goal: extract the employee interaction-handler input assembly from `src/app/employee/page.tsx` into a dedicated orchestrator hook while preserving existing regression anchors.
- Scope:
  - `src/app/employee/page.tsx`
  - `src/app/employee/page-interaction-actions.ts`
  - `src/app/employee/page-interaction-orchestrator.ts`
  - `scripts/tests/e2e-wi0507-employee-page-interaction-orchestrator-hook-extraction-line-budget-margin.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `useEmployeeInteractionOrchestratorInput` in `page-interaction-orchestrator.ts` to centralize interaction handler input composition.
- Exported `BuildEmployeeInteractionHandlersInput` from `page-interaction-actions.ts` for shared typing.
- Rewired `src/app/employee/page.tsx` to:
  - keep direct `buildEmployeeInteractionHandlers({...})` invocation (legacy regression anchor),
  - move interaction input object assembly into the orchestrator hook.
- Maintained employee page line-budget:
  - `src/app/employee/page.tsx`: 499 lines (<= 500 guard)

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0404-employee-interaction-handler-builder-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0389-employee-mutation-action-orchestrator-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0351-leave-calendar-cell-click-prefill-leave-form.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0433-employee-mutation-runtime-extraction-and-line-budget-500.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0507-employee-page-interaction-orchestrator-hook-extraction-line-budget-margin.test.ts`
