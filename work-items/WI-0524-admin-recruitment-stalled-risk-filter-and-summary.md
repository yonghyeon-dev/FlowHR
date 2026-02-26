# WI-0524: Admin Recruitment Stalled Risk Filter and Summary

## Summary
- Goal: improve recruitment referral triage by exposing stalled pipeline items quickly.
- Scope:
  - `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
  - `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx`
  - `src/components/recruitment/copy.ts`
  - `scripts/tests/e2e-wi0524-admin-recruitment-stalled-risk-filter-and-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added referral risk filter (`all` / `stalled_7d`) to admin recruitment referral queue.
- Added stalled referral summary count (non-terminal referrals updated more than 7 days ago).
- Added per-referral stalled risk badge in the list.
- Added Korean/English copy for risk filter and summary labels.
- Kept `AdminRecruitmentWorkspace.tsx` line budget (`<= 300`) intact.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0524-admin-recruitment-stalled-risk-filter-and-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0498-admin-recruitment-referral-filter-search-and-opening-visibility.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0475-admin-recruitment-workspace-view-decomposition.test.ts`
- [x] `npm.cmd run typecheck`

