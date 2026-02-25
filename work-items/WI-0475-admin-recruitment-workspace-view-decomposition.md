# WI-0475: Admin Recruitment Workspace View Decomposition

## Summary
- Goal: reduce `/admin/recruitment` workspace bloat and isolate API orchestration from JSX rendering.
- Scope:
  - `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
  - `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx` (new)

## Delivery
- Added `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx`
  - Extracted admin recruitment JSX panels (session/opening/referral).
  - Preserved existing stage update controls and copy keys.
- Updated `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
  - Kept fetch/mutation orchestration and state transitions.
  - Delegated rendering to `AdminRecruitmentWorkspaceView`.
  - Reduced line count to <= 300.
- Added regression test:
  - `scripts/tests/e2e-wi0475-admin-recruitment-workspace-view-decomposition.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0409-recruitment-core-journey-implementation.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0420-recruitment-referral-filter-opening-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0475-admin-recruitment-workspace-view-decomposition.test.ts`
