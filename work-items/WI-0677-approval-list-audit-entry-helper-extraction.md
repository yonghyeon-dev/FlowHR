# WI-0677 Approval List Audit Entry Helper Extraction

## Summary
- extracted approval list-path audit-entry composition from
  `src/features/approval/service.ts` into:
  - `src/features/approval/list-audit-entry-helpers.ts`
- moved reusable entry builders:
  - `buildApprovalStageHistoryListedAuditEntry`
  - `buildApprovalExecutionListedAuditEntry`
- rewired `listApprovalStageHistory` and `listApprovalExecutions` to append
  helper-generated audit entries.
- preserved action/entity/payload semantics.
- added WI-0677 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0677-approval-list-audit-entry-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0663-approval-stage-history-audit-payload-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0668-approval-execution-list-audit-payload-helper-extraction.test.ts`
- `npm.cmd run typecheck`
