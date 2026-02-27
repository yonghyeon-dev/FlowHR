# WI-0589: Admin Approval Queue Quick Visibility

## Summary
- Goal: improve admin approval queue triage visibility with fast severity summary and critical-queue focus action.
- Scope:
  - `src/components/admin-approval/ApprovalQueueSearchSortPanel.tsx`
  - `scripts/tests/e2e-wi0589-admin-approval-queue-quick-visibility.test.ts`
  - `ROADMAP.md`

## Delivery
- Added search/sort summary metrics in approval queue panel:
  - visible rows
  - critical rows
  - watch rows
  - selected rows
- Added quick action button to focus the queue with the highest critical count.
- Kept approval queue search/sort panel under line budget (`<= 300`).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0589-admin-approval-queue-quick-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0350-admin-approval-queue-mobile-ux-enhancement.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0219-self-service-ia-and-approval-queue-split.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0128-admin-approval-queue-ux-upgrade.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
