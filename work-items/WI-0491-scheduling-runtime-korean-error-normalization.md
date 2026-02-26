# WI-0491: Scheduling Runtime Korean Error Normalization

## Summary
- Goal: prevent raw English scheduling API errors from leaking to Korean runtime and provide actionable Korean guidance in admin/employee scheduling flows.
- Scope:
  - `src/components/scheduling/helpers.ts`
  - `src/components/scheduling/runtime-error-copy.ts`
  - `scripts/tests/e2e-wi0491-scheduling-runtime-korean-error-normalization.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `normalizeSchedulingRuntimeMessage(...)` in scheduling helpers.
- Added known Korean mappings for frequent scheduling error patterns:
  - actor/session invalid
  - manager query employeeId required
  - own-schedule only restriction
  - permission denial
  - date/time validation
  - overlap conflicts
  - schedule not found
  - org/employee scope validation
  - network/timeout/server failures
- Updated `extractErrorMessage(...)` to pass extracted messages through runtime normalization.
- Added WI-0491 regression test and line-budget guard.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0491-scheduling-runtime-korean-error-normalization.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0468-employee-schedule-csv-export-action.test.ts`
- [x] `npm.cmd run typecheck`
