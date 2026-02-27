# WI-0600: Admin Contracts Next-Step Filter and Summary

## Summary
- Goal: improve `/admin/contracts` triage speed by letting admins filter document queue by concrete next-step state.
- Scope:
  - `src/components/contracts/useAdminContractsDocumentFilters.ts`
  - `src/components/contracts/AdminContractsDocumentFilterControls.tsx`
  - `src/components/contracts/AdminContractsWorkspace.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0600-admin-contracts-next-step-filter-and-summary.test.ts`
  - `work-items/WI-0600-admin-contracts-next-step-filter-and-summary.md`
  - `ROADMAP.md`

## Delivery
- Added next-step filter model in admin contracts filter hook:
  - `ContractDocumentNextStepFilter = ContractDocumentNextStepKey | "ALL"`
  - state pair: `nextStepFilter / setNextStepFilter`
  - per-step counts via `nextStepCounts`
  - visible document filtering now supports next-step filtering.
- Extended filter controls UI:
  - next-step dropdown (`ALL`, request/approve/send/wait/renew/no-action)
  - next-step queue summary line for core admin-action buckets
  - quick toggle buttons for `ALL / REQUEST_APPROVAL / APPROVE_OR_REJECT / SEND_DOCUMENT`.
- Added locale copy for next-step filter labels (`ko`, `en`).
- Preserved workspace line budget:
  - `AdminContractsWorkspace.tsx` stays `<= 260`.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0600-admin-contracts-next-step-filter-and-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0590-admin-contracts-decision-queue-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0540-admin-contracts-sla-risk-filter-and-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0555-admin-contracts-expiration-window-quick-toggles.test.ts`
- [x] `npm.cmd run typecheck`
