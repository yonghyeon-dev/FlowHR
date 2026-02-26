# WI-0540: Admin Contracts SLA Risk Filter and Summary

## Summary
- Goal: prioritize admin action by exposing SLA-risk-focused contract document filtering and queue summaries.
- Scope:
  - `src/components/contracts/useAdminContractsDocumentFilters.ts`
  - `src/components/contracts/AdminContractsDocumentFilterControls.tsx`
  - `src/components/contracts/AdminContractsWorkspace.tsx`
  - `src/components/contracts/copy.ts`
  - `scripts/tests/e2e-wi0540-admin-contracts-sla-risk-filter-and-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added SLA risk filter state (`ALL | DUE_SOON | OVERDUE`) to admin contract document filters.
- Added derived SLA risk counters (`dueSoonSlaCount`, `overdueSlaCount`) and queue filtering logic.
- Added SLA risk badges in document list rows for due-soon and overdue items.
- Extended admin contracts copy bundle with localized SLA filter/summary/badge labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0496-admin-contracts-document-search-status-filter.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0540-admin-contracts-sla-risk-filter-and-summary.test.ts`

