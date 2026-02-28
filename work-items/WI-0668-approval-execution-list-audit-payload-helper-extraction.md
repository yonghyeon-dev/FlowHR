# WI-0668 Approval Execution List Audit Payload Helper Extraction

## Summary
- extended `src/features/approval/audit-payload-helpers.ts` with:
  - `buildApprovalExecutionListedAuditPayload`
- rewired `listApprovalExecutions` audit append path in
  `src/features/approval/service.ts` to use the extracted payload builder.
- kept `approval.execution.listed` audit payload schema unchanged.
- added WI-0668 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0668-approval-execution-list-audit-payload-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0663-approval-stage-history-audit-payload-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0121-approval-execution-priority-listing.test.ts`
- `npm.cmd run typecheck`
