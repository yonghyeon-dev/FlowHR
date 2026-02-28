# WI-0671 Approval Execution List Helper Extraction

## Summary
- extracted approval execution list-path normalization/selection logic from
  `src/features/approval/service.ts` into:
  - `src/features/approval/execution-list-helpers.ts`
- moved reusable blocks:
  - list option normalization (`limit/sort/stalledHoursMin/asOf`)
  - list row selection pipeline (stalled filter, priority sort, limit cap)
- rewired `listApprovalExecutions` in approval service to delegate to helper APIs.
- preserved listing behavior and audit payload semantics.
- added WI-0671 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0671-approval-execution-list-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0121-approval-execution-priority-listing.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0668-approval-execution-list-audit-payload-helper-extraction.test.ts`
- `npm.cmd run typecheck`
