# WI-0649 Admin Approval Executions Line-Budget Decomposition

## Summary
- decomposed `/admin/approval-executions` UI into dedicated section components:
  - `ApprovalExecutionWorkConditionsPanel`
  - `ApprovalExecutionSummaryPanel`
  - `ApprovalExecutionEscalationResultPanel`
  - `ApprovalExecutionListPanel`
  - `ApprovalExecutionHistoryPanel`
  - `ApprovalExecutionLogsPanel`
  - `ApprovalExecutionRelatedWorkspacesPanel`
- extracted shared helper functions and DTO/types into:
  - `src/app/admin/approval-executions/page-helpers.ts`
  - `src/app/admin/approval-executions/page-types.ts`
- reduced `src/app/admin/approval-executions/page.tsx` to a coordinator component to recover line budget and keep behavior stable

## Scope
- UI decomposition and maintainability refactor only
- no API contract or schema changes
- preserve existing product UX behavior from WI-0643

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0643-admin-approval-executions-product-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0649-admin-approval-executions-line-budget-decomposition.test.ts`
- `npm.cmd run typecheck`
