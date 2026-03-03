# WI-0818 Benefits History Name Resolution With Inactive Catalog

## Summary
- Fixed employee benefits history name-resolution gap for requests linked to inactive catalog items.
- Switched employee benefits catalog fetch to full organization catalog and split requestable items (`ACTIVE`) at UI runtime.
- Kept request submission restricted to active catalog items while preserving historical item-name visibility in request history.

## Scope
- `src/components/benefits/EmployeeBenefitsWorkspace.tsx`
- `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
- `scripts/tests/e2e-wi0818-benefits-history-name-resolution-with-inactive-catalog.test.ts` (new)

## Acceptance
1. Employee request history resolves benefit names even when catalog item status is `INACTIVE`.
2. Submit dropdown/list only exposes `ACTIVE` catalog items.
3. Employee benefits workspace/view remain within line-budget guards.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0818-benefits-history-name-resolution-with-inactive-catalog.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0814-employee-benefits-deeplink-filters-and-session-autoload.test.ts`
- `npm.cmd run build`
