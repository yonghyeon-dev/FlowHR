# WI-0497: Admin Benefits Request Filter/Search and Benefit Name Visibility

## Summary
- Goal: improve admin triage productivity in `/admin/benefits` by adding request status filter/search and showing benefit names in the request queue.
- Scope:
  - `src/components/benefits/AdminBenefitsWorkspace.tsx`
  - `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
  - `src/components/benefits/copy.ts`
  - `scripts/tests/e2e-wi0497-admin-benefits-request-filter-search-and-benefit-name-visibility.test.ts`
  - `ROADMAP.md`

## Delivery
- Added admin request queue filter/search controls:
  - status filter (`all`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELED`)
  - search by employee ID, benefit name, and reason
  - visible/total request count summary and filtered-empty guidance
- Added benefit-name visibility in each request row using catalog ID-to-name mapping with locale fallback.
- Kept workspace line budget within guardrail (`AdminBenefitsWorkspace.tsx` <= 300).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0399-notice-benefits-recruitment-baseline-routes-and-nav-i18n-wiring.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-and-name-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0474-admin-benefits-workspace-view-decomposition.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0497-admin-benefits-request-filter-search-and-benefit-name-visibility.test.ts`
- [x] `npm.cmd run typecheck`
