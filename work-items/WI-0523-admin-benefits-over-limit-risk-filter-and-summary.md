# WI-0523: Admin Benefits Over-Limit Risk Filter and Summary

## Summary
- Goal: improve admin benefits approval queue triage by surfacing over-limit requests first.
- Scope:
  - `src/components/benefits/AdminBenefitsWorkspace.tsx`
  - `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
  - `src/components/benefits/copy.ts`
  - `scripts/tests/e2e-wi0523-admin-benefits-over-limit-risk-filter-and-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added request risk filter (`all` / `over_limit`) in admin benefits workspace state and UI.
- Added over-limit request summary count in request stats.
- Added per-request over-limit badge and exceed amount display in admin request list.
- Added locale copy entries for Korean/English labels.
- Kept `AdminBenefitsWorkspace.tsx` within line budget guard (`<= 300`).

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0523-admin-benefits-over-limit-risk-filter-and-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0497-admin-benefits-request-filter-search-and-benefit-name-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0474-admin-benefits-workspace-view-decomposition.test.ts`
- [x] `npm.cmd run typecheck`

