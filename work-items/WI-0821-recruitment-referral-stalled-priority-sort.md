# WI-0821 Recruitment Referral Stalled-Priority Sort

## Summary
- Added optional `sort` query support to `GET /api/recruitment/referrals`.
- Implemented `stalled_priority` ordering so active referrals are listed before terminal referrals, with 14d+ stalled items first and then 7d+ stalled items.
- Wired admin recruitment workspace data load to use `sort=stalled_priority` so reviewer queues open in risk-priority order by default.

## Scope
- `src/features/recruitment/types.ts`
- `src/features/recruitment/schemas.ts`
- `src/features/recruitment/store.ts`
- `src/app/api/recruitment/referrals/route.ts`
- `src/components/recruitment/AdminRecruitmentWorkspace.tsx`
- `specs/people/contract.yaml`
- `specs/people/api.yaml`
- `specs/people/test-cases.md`
- `scripts/tests/e2e-wi0821-recruitment-referral-stalled-priority-sort.test.ts` (new)

## Acceptance
1. `GET /api/recruitment/referrals` accepts optional `sort` query with `updated_desc | stalled_priority`.
2. `sort=stalled_priority` returns active referrals first, prioritizing 14d+ stalled and then 7d+ stalled items.
3. `/admin/recruitment` workspace request load uses `sort=stalled_priority` by default.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0821-recruitment-referral-stalled-priority-sort.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0763-admin-analytics-recruitment-kpi-panel.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0819-benefits-catalog-deactivate-pending-guard.test.ts`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
