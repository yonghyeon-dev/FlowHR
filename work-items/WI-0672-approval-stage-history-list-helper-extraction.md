# WI-0672 Approval Stage-History List Helper Extraction

## Summary
- extracted approval stage-history list-path normalization/query-input composition from
  `src/features/approval/service.ts` into:
  - `src/features/approval/stage-history-list-helpers.ts`
- moved reusable blocks:
  - list limit normalization (`1..500` clamp with default `100`)
  - stage-history query input builder (trimmed target entity fields)
- rewired `listApprovalStageHistory` in approval service to delegate to helper APIs.
- preserved stage-history listing behavior and audit payload semantics.
- added WI-0672 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0672-approval-stage-history-list-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0116-approval-stage-history-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0663-approval-stage-history-audit-payload-helper-extraction.test.ts`
- `npm.cmd run typecheck`
