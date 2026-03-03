# WI-0823 Employee Recruitment Deeplink Filters and Session Auto-Load

## Summary
- Added query-driven initial filter hydration for `/employee/recruitment` (`stage`, `risk`, `opening`, `q`).
- Added one-shot session-ready auto-load so employee recruitment workspace loads without manual refresh once session context is ready.
- Applied stalled-priority referral loading in employee workspace request path to align with stalled-risk triage behavior.

## Scope
- `src/components/recruitment/EmployeeRecruitmentWorkspace.tsx`
- `scripts/tests/e2e-wi0823-employee-recruitment-deeplink-autoload.test.ts` (new)

## Acceptance
1. `/employee/recruitment?stage=...&risk=...&opening=...&q=...` initializes filters/search on first render.
2. Workspace auto-loads once when session organization/token becomes ready.
3. Referral load query includes `sort=stalled_priority` and workspace remains within line budget (`<=300`).

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0823-employee-recruitment-deeplink-autoload.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0550-employee-recruitment-workspace-view-decomposition-and-line-budget-recovery.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0822-admin-recruitment-deeplink-autoload.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
