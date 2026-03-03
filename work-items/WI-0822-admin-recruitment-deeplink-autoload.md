# WI-0822 Admin Recruitment Deeplink Filters and Session Auto-Load

## Summary
- Added query-driven initial filter hydration for `/admin/recruitment` (`stage`, `risk`, `q`).
- Added one-shot session-ready auto-load so admin recruitment workspace loads data automatically once session context is available.
- Reused existing recruitment helper utilities to keep `AdminRecruitmentWorkspace.tsx` within line budget.

## Scope
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `src/components/recruitment/employee-recruitment-helpers.ts`
- `scripts/tests/e2e-wi0822-admin-recruitment-deeplink-autoload.test.ts` (new)

## Acceptance
1. `/admin/recruitment?stage=...&risk=...&q=...` initializes filters/search from query params.
2. Workspace auto-loads once when session organization/token becomes ready.
3. `AdminRecruitmentWorkspace.tsx` remains within the `<=300` line-budget guard.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0822-admin-recruitment-deeplink-autoload.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0475-admin-recruitment-workspace-view-decomposition.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0821-recruitment-referral-stalled-priority-sort.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
