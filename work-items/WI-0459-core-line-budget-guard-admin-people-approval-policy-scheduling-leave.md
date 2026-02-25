# WI-0459: Core Line Budget Guard (Approval Policy/People/Scheduling/Leave)

## Summary
- Goal: Add a consolidated guard test to prevent re-growth after WI-0454~0457 decomposition.
- Scope:
  - Enforce line budgets for key pages/services and extracted helper modules.
  - Verify decomposition wiring imports remain intact.

## Delivery
- Added `scripts/tests/e2e-wi0459-core-line-budget-guard-admin-people-approval-policy-scheduling-leave.test.ts`
  - Line budgets:
    - `src/app/admin/approval-policy/page.tsx` <= 500
    - `src/app/admin/approval-policy/page-types.ts` <= 120
    - `src/app/admin/people/page-view.tsx` <= 300
    - `src/features/scheduling/service.ts` <= 5300
    - `src/features/scheduling/incident-audit-projection.ts` <= 260
    - `src/features/leave/service.ts` <= 3000
    - `src/features/leave/promotion-delivery-helpers.ts` <= 280
  - Import wiring assertions for extracted modules.

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0459-core-line-budget-guard-admin-people-approval-policy-scheduling-leave.test.ts`
