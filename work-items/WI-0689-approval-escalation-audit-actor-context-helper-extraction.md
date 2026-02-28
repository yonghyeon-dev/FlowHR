# WI-0689 Approval Escalation Audit-Actor Context Helper Extraction

## Summary
- added `buildApprovalExecutionEscalationAuditActorContext` to
  `src/features/approval/execution-escalation-audit-entry-helpers.ts`.
- rewired `triggerApprovalExecutionEscalation` in
  `src/features/approval/service.ts` to build shared escalation audit actor context once
  and reuse across generated/requested/failed/event_publish_failed audit entries.
- preserved escalation audit behavior.
- added WI-0689 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0689-approval-escalation-audit-actor-context-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0684-approval-escalation-audit-entry-helper-extraction.test.ts`
- `npm.cmd run typecheck`
