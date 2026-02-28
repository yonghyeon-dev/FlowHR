# WI-0669 Approval Escalation Input Helper Extraction

## Summary
- extracted escalation policy normalization and candidate-selection logic from
  `src/features/approval/service.ts` into:
  - `src/features/approval/execution-escalation-input-helpers.ts`
- moved reusable blocks:
  - stalled-hours/limit/dry-run/notification-channel normalization
  - stalled execution filtering + priority sorting + top-limit selection
- rewired `triggerApprovalExecutionEscalation` to consume helper exports.
- preserved escalation selection semantics and defaults.
- added WI-0669 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0669-approval-escalation-input-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0121-approval-execution-priority-listing.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0123-approval-execution-escalation-automation.test.ts`
- `npm.cmd run typecheck`
