# WI-0670 Approval Escalation Response Helper Extraction

## Summary
- extracted escalation response type and builder from
  `src/features/approval/service.ts` into:
  - `src/features/approval/execution-escalation-response-helpers.ts`
- moved reusable response shaping logic:
  - policy/filter/counts composition
  - requested/dry-run/skipped count derivation
  - webhook configured flag derivation
- rewired `triggerApprovalExecutionEscalation` to return helper-built response and imported response type.
- kept response schema and values unchanged.
- added WI-0670 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0670-approval-escalation-response-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0669-approval-escalation-input-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0123-approval-execution-escalation-automation.test.ts`
- `npm.cmd run typecheck`
