# WI-0496: Admin Contracts Document Search and Status Filter Core Journey

## Summary
- Goal: improve operator throughput in `/admin/contracts` by allowing quick document lookup and status filtering without adding i18n-only scope.
- Scope:
  - `src/components/contracts/AdminContractsWorkspace.tsx`
  - `src/components/contracts/AdminContractsDocumentFilterControls.tsx`
  - `src/components/contracts/useAdminContractsDocumentFilters.ts`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0496-admin-contracts-document-search-status-filter.test.ts`
  - `ROADMAP.md`

## Delivery
- Added a dedicated document filter path in admin contracts workspace:
  - search by title/document ID/employee ID (including locale-formatted employee ID)
  - status filter (`ALL` + all contract document statuses)
  - visible/total count summary
- Kept `AdminContractsWorkspace.tsx` orchestration-focused and within line-budget margin.
- Extracted document filtering logic to `useAdminContractsDocumentFilters` and filter UI to `AdminContractsDocumentFilterControls`.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0174-admin-contracts-ux-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0335-contracts-locale-dynamic-ui-gap-fix.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0495-admin-contracts-workspace-action-hook-extraction-line-budget-margin.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0496-admin-contracts-document-search-status-filter.test.ts`
- [x] `npm.cmd run typecheck`
