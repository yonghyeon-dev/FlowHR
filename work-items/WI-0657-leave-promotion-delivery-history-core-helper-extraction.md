# WI-0657 Leave Promotion Delivery History Core Helper Extraction

## Summary
- extracted promotion delivery history core helpers from `src/features/leave/service.ts` into:
  - `src/features/leave/promotion-delivery-history-core-helpers.ts`
- moved reusable blocks:
  - promotion target recipient stats resolver
  - delivery history persistence (delivery + recipient snapshot rows)
  - retry recipient employee-id normalization
- rewired leave service dispatch/retry call sites to use extracted helper exports.
- reduced `src/features/leave/service.ts` line count from 2525 to 2410.
- added WI-0657 regression guard for helper extraction and line budget.

## Scope
- leave service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0657-leave-promotion-delivery-history-core-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0457-leave-promotion-delivery-helper-extraction-line-budget-3000.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0461-leave-promotion-history-view-helper-extraction-line-budget-2850.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0464-leave-policy-time-helper-extraction-line-budget-2600.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0122-leave-promotion-notify.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0125-leave-promotion-delivery-history-retry.test.ts`
- `npm.cmd run typecheck`
