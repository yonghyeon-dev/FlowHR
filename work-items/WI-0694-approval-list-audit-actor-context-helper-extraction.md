# WI-0694 Approval List Audit-Actor Context Helper Extraction

## Summary
- added `buildApprovalListAuditActorContext` in
  `src/features/approval/list-audit-entry-helpers.ts`.
- rewired `listApprovalStageHistory` and `listApprovalExecutions` in
  `src/features/approval/service.ts` to build list audit actor context once per flow
  and pass it to list audit entry builders.
- preserved list audit behavior.
- added WI-0694 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0694-approval-list-audit-actor-context-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0677-approval-list-audit-entry-helper-extraction.test.ts`
- `npm.cmd run typecheck`
