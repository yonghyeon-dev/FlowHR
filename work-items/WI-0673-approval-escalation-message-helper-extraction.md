# WI-0673 Approval Escalation Message Helper Extraction

## Summary
- extracted approval execution escalation message composition from
  `src/features/approval/service.ts` into:
  - `src/features/approval/execution-escalation-message-helpers.ts`
- rewired `triggerApprovalExecutionEscalation` to call the extracted helper.
- preserved webhook payload message shape (header, metadata lines, candidate cap=50).
- added WI-0673 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0673-approval-escalation-message-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0670-approval-escalation-response-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0669-approval-escalation-input-helper-extraction.test.ts`
- `npm.cmd run typecheck`
