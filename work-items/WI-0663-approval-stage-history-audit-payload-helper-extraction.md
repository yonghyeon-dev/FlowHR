# WI-0663 Approval Stage-History Audit Payload Helper Extraction

## Summary
- extracted approval audit payload builders from
  `src/features/approval/service.ts` into:
  - `src/features/approval/audit-payload-helpers.ts`
- moved reusable payload builders:
  - stage-history listing audit payload
  - execution escalation audit base payload
  - execution escalation failure payload
- rewired approval service stage-history and escalation audit append call sites to use extracted helper exports.
- kept audit action names and payload semantics unchanged.
- added WI-0663 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0663-approval-stage-history-audit-payload-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0658-approval-execution-escalation-core-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0116-approval-stage-history-baseline.test.ts`
- `npm.cmd run typecheck`
