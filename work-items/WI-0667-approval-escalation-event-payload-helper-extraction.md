# WI-0667 Approval Escalation Event Payload Helper Extraction

## Summary
- extracted approval escalation event payload builder from
  `src/features/approval/service.ts` into:
  - `src/features/approval/execution-escalation-event-payload-helpers.ts`
- moved reusable event payload composition for:
  - `approval.execution.escalation.requested.v1`
- rewired escalation event publish path to delegate payload assembly to helper.
- preserved event schema and item cap behavior (`items.slice(0, 100)`).
- added WI-0667 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0667-approval-escalation-event-payload-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0658-approval-execution-escalation-core-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0663-approval-stage-history-audit-payload-helper-extraction.test.ts`
- `npm.cmd run typecheck`
