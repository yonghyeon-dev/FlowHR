# WI-0837 Admin Analytics Contract Focus Deeplink Refine

## Summary
- Refined admin analytics focus-workspace deeplink mapping for contract metrics.
- Routed contract decision queue focus directly to decision-only contracts queue.
- Routed contract SLA overdue focus directly to overdue-risk contracts queue.

## Scope
- `src/components/admin-kpi/AdminKpiDashboard.tsx`
- `scripts/tests/e2e-wi0837-admin-analytics-contract-focus-deeplink-refine.test.ts` (new)

## Acceptance
1. `contractDecisionQueueCount` focus opens `/admin/contracts?decisionQueueOnly=true`.
2. `contractSlaOverdueCount` focus opens `/admin/contracts?slaRisk=OVERDUE`.
3. Existing focus analytics context query handoff remains intact.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0837-admin-analytics-contract-focus-deeplink-refine.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0802-admin-analytics-kpi-card-quick-jumps.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
