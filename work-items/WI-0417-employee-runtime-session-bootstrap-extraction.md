# WI-0417: Employee Runtime Session Bootstrap Extraction

## Summary
- Goal: keep `src/app/employee/page.tsx` under line budget while preserving existing helper-extraction regressions.
- Change:
  - Added `src/app/employee/page-session-helpers.ts` and moved runtime session bootstrap concerns:
    - `useSupabaseSession` binding
    - bearer-token resolution
    - organization/actor auto-sync effects
    - runtime flags (`showDevTools`, `isProductionRuntime`, `supabaseUrl`)
  - Rewired `src/app/employee/page.tsx` to consume `useEmployeeRuntimeSession`.
- Outcome:
  - Existing employee-page helper wiring remains intact.
  - `src/app/employee/page.tsx` line count reduced from 975 to 957.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-session-helpers.ts`
- `scripts/tests/e2e-wi0417-employee-runtime-session-bootstrap-extraction.test.ts`
- `work-items/WI-0417-employee-runtime-session-bootstrap-extraction.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0375-employee-api-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0389-employee-mutation-action-orchestrator-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0404-employee-interaction-handler-builder-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0417-employee-runtime-session-bootstrap-extraction.test.ts`

