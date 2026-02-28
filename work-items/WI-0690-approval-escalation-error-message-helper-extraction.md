# WI-0690 Approval Escalation Error-Message Helper Extraction

## Summary
- extracted escalation error-message normalization into
  `toApprovalExecutionEscalationErrorMessage` in
  `src/features/approval/execution-escalation-audit-entry-helpers.ts`.
- rewired `triggerApprovalExecutionEscalation` failure audit payload paths in
  `src/features/approval/service.ts` to use the helper.
- preserved failure reason and error-message semantics.
- added WI-0690 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0690-approval-escalation-error-message-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0684-approval-escalation-audit-entry-helper-extraction.test.ts`
- `npm.cmd run typecheck`
