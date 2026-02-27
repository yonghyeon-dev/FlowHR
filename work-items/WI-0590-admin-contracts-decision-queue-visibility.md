# WI-0590: Admin Contracts Decision Queue Visibility

## Summary
- Goal: surface admin-immediate decision backlog in `/admin/contracts` so triage can focus on documents waiting for admin action.
- Scope:
  - `src/components/contracts/useAdminContractsDocumentFilters.ts`
  - `src/components/contracts/AdminContractsDocumentFilterControls.tsx`
  - `src/components/contracts/AdminContractsWorkspace.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0590-admin-contracts-decision-queue-visibility.test.ts`
  - `ROADMAP.md`

## Delivery
- Added decision queue classification in admin contracts filter hook:
  - defines documents where next step is admin-driven (`REQUEST_APPROVAL`, `APPROVE_OR_REJECT`, `SEND_DOCUMENT`)
  - exposes `decisionQueueOnly` filter state and `decisionQueueCount` summary
- Added decision queue UI controls in contracts filter panel:
  - checkbox toggle for decision queue only
  - summary metric for decision queue count
- Kept admin contracts workspace within line budget (`<= 260`).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0590-admin-contracts-decision-queue-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0555-admin-contracts-expiration-window-quick-toggles.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0540-admin-contracts-sla-risk-filter-and-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0518-contract-expiry-renewal-queue-filters.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
