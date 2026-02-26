# WI-0538: Admin Recruitment Stalled-Risk Expansion (7d/14d)

## Summary
- Goal: improve recruitment queue triage in `/admin/recruitment` by adding critical stall threshold handling.
- Scope:
  - `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
  - `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx`
  - `src/components/recruitment/copy.ts`
  - `scripts/tests/e2e-wi0538-admin-recruitment-stalled-risk-expansion.test.ts`
  - `ROADMAP.md`

## Delivery
- Expanded risk filter to `all | stalled_7d | stalled_14d`.
- Added 14-day critical stall counter and summary line.
- Added critical stall badge in referral rows (with 7-day badge fallback).
- Extended admin recruitment copy bundle with 14-day filter/summary/badge labels.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0538-admin-recruitment-stalled-risk-expansion.test.ts`
