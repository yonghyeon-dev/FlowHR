# WI-0428: Employee Request-Flow Helper Extraction

## Summary
- Goal: reduce `src/app/employee/page.tsx` inline derived-logic density without behavior change.
- Change:
  - Added helper extraction in `page-derived-helpers.ts`:
    - `buildRequestFlowStats`
    - `resolveSelectedResubmitCandidate`
  - Rewired `src/app/employee/page.tsx` to use extracted helpers for completion-rate and selected-resubmit derivation.
- Outcome:
  - Employee page keeps orchestration focus while request-flow derivation remains centralized in helper layer.

## Scope
- `src/app/employee/page-derived-helpers.ts`
- `src/app/employee/page.tsx`
- `scripts/tests/e2e-wi0428-employee-request-flow-helper-extraction.test.ts`
- `work-items/WI-0428-employee-request-flow-helper-extraction.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0404-employee-interaction-handler-builder-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0417-employee-runtime-session-bootstrap-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0428-employee-request-flow-helper-extraction.test.ts`
