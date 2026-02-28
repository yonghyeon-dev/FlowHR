# WI-0658 Approval Execution Escalation Core Helper Extraction

## Summary
- extracted approval execution escalation core helpers from `src/features/approval/service.ts` into:
  - `src/features/approval/execution-escalation-core-helpers.ts`
- moved reusable blocks:
  - execution stalled-hours and priority comparator
  - escalation candidate item projection
  - webhook config resolution and webhook dispatch transport
- rewired approval service listing/escalation call sites to use extracted helper exports.
- reduced `src/features/approval/service.ts` line count from 2187 to 2043.
- added WI-0658 regression guard for helper extraction and line budget.

## Scope
- approval service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0658-approval-execution-escalation-core-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0121-approval-execution-priority-listing.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0123-approval-execution-escalation-automation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0108-approval-delegation-expiry-scheduler.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0117-approval-template-multi-stage-baseline.test.ts`
- `npm.cmd run typecheck`
