# WI-0833 Admin Contracts Deeplink Filter Hydration

## Summary
- Added query-based initial filter hydration to `/admin/contracts`.
- Extended admin contract document filter hook with reusable query normalizers.
- Wired deeplink query keys for status/search/sla/decision/renewal/next-step filters.

## Scope
- `src/components/contracts/AdminContractsWorkspace.tsx`
- `src/components/contracts/useAdminContractsDocumentFilters.ts`
- `scripts/tests/e2e-wi0833-admin-contracts-deeplink-filter-hydration.test.ts` (new)

## Acceptance
1. `/admin/contracts` reads deeplink query params on first load and applies them as initial filter state.
2. Supported query keys: `q`, `status`, `expiresInDays`, `slaRisk`, `decisionQueueOnly`, `renewalCandidateOnly`, `nextStep`.
3. Filter normalization helpers are exported and covered by WI regression assertions.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0833-admin-contracts-deeplink-filter-hydration.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0832-admin-analytics-contract-priority-action-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
