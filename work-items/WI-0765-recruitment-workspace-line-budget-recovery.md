# WI-0765 Recruitment Workspace Line Budget Recovery

## Summary
- fixed `e2e-wi0476` failure by reducing `AdminRecruitmentWorkspace` line count from 315 to 295.
- kept recruitment behavior unchanged and only compacted structure/whitespace.
- preserved existing referral filter/search/status update and opening close-guard confirm flow.

## Scope
- line-budget regression recovery for admin recruitment workspace only
- no API/domain/model/schema change
- no ops/devtools expansion

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0476-admin-non-payroll-workspace-line-budget-guard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0475-admin-recruitment-workspace-view-decomposition.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0498-admin-recruitment-referral-filter-search-and-opening-visibility.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0409-recruitment-core-journey-implementation.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run build`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
