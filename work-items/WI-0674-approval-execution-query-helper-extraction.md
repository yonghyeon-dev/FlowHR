# WI-0674 Approval Execution Query Helper Extraction

## Summary
- extracted approval execution list query input composition from
  `src/features/approval/service.ts` into:
  - `src/features/approval/execution-query-helpers.ts`
- added reusable builders:
  - `buildApprovalExecutionListQueryInput` for execution listing filters
  - `buildPendingApprovalExecutionQueryInput` for escalation pending lookup
- rewired `listApprovalExecutions` and `triggerApprovalExecutionEscalation`
  to delegate query-input construction to helpers.
- preserved execution listing/escalation behavior.
- added WI-0674 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0674-approval-execution-query-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0671-approval-execution-list-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0669-approval-escalation-input-helper-extraction.test.ts`
- `npm.cmd run typecheck`
