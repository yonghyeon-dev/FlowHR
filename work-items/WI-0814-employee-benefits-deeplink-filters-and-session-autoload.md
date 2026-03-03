# WI-0814 Employee Benefits Deeplink Filters + Session Auto-Load

## Summary
- Added deep-link filter hydration for `/employee/benefits` using query params:
  - `status`: request status filter
  - `risk`: request risk filter
  - `q`: request search query
- Added one-shot auto-load so employee benefits data loads automatically once session context is ready.
- Kept employee benefits workspace within line-budget guard (`<= 300`).

## Scope
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `src/components/benefits/employee-benefits-helpers.ts`
- `scripts/tests/e2e-wi0814-employee-benefits-deeplink-filters-and-session-autoload.test.ts` (new)

## Acceptance
1. Employee benefits workspace can be opened with query-based initial filters/search.
2. Workspace auto-loads catalog/request data once session context is available.
3. Existing submit/cancel/filter behavior remains intact.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0549-employee-benefits-workspace-view-decomposition-and-line-budget-recovery.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0547-employee-benefits-pending-aging-risk-filter-and-badge.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0814-employee-benefits-deeplink-filters-and-session-autoload.test.ts`

## Notes
- This is a user-journey improvement for faster benefits triage from shared links and session-ready entry.
