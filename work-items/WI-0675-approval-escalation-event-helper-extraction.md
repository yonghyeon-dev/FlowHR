# WI-0675 Approval Escalation Event Helper Extraction

## Summary
- extracted approval execution escalation requested-event composition from
  `src/features/approval/service.ts` into:
  - `src/features/approval/execution-escalation-event-helpers.ts`
- moved event envelope + payload composition into the helper while preserving:
  - event name/version (`approval.execution.escalation.requested.v1`)
  - payload shape and candidate cap behavior from existing payload helper
- rewired escalation publish call-site in service to use helper.
- added WI-0675 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0675-approval-escalation-event-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0667-approval-escalation-event-payload-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0670-approval-escalation-response-helper-extraction.test.ts`
- `npm.cmd run typecheck`
