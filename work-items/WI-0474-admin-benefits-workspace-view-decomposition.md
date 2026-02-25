# WI-0474: Admin Benefits Workspace View Decomposition

## Summary
- Goal: reduce `/admin/benefits` workspace bloat and separate orchestration from render concerns.
- Scope:
  - `src/components/benefits/AdminBenefitsWorkspace.tsx`
  - `src/components/benefits/AdminBenefitsWorkspaceView.tsx` (new)

## Delivery
- Added `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
  - Extracted admin benefits JSX panels (session/catalog/request/logs).
  - Preserved existing copy keys and actions.
- Updated `src/components/benefits/AdminBenefitsWorkspace.tsx`
  - Kept API/runtime orchestration and state transitions only.
  - Delegated rendering to `AdminBenefitsWorkspaceView`.
  - Reduced line count to <= 300.
- Added regression test:
  - `scripts/tests/e2e-wi0474-admin-benefits-workspace-view-decomposition.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0408-benefits-core-journey-implementation.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0419-benefits-request-filter-name-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0474-admin-benefits-workspace-view-decomposition.test.ts`
