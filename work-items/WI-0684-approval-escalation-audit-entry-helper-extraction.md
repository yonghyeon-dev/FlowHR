# WI-0684 Approval Escalation Audit-Entry Helper Extraction

## Summary
- extracted approval escalation audit-entry envelope composition from
  `src/features/approval/service.ts` into:
  - `src/features/approval/execution-escalation-audit-entry-helpers.ts`
- added reusable builders for escalation audit actions:
  - generated
  - requested
  - failed
  - event_publish_failed
- rewired `triggerApprovalExecutionEscalation` to append helper-generated entries.
- preserved payload-builder usage and escalation behavior.
- added WI-0684 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0684-approval-escalation-audit-entry-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0669-approval-escalation-input-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0670-approval-escalation-response-helper-extraction.test.ts`
- `npm.cmd run typecheck`
