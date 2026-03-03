# WI-0864 Admin Contracts Analytics Return Focus Restore

## Summary
- Propagated `analyticsFocus` context from `/admin/analytics` to contract KPI priority/quick action links.
- Restored analytics focus on `/admin/contracts` return action so users can go back to `/admin/analytics?focus=...`.
- Preserved existing `source=admin-analytics` and `focusMetric` queue-context banner behavior.

## Scope
- `src/components/admin-kpi/AdminKpiDashboard.tsx`
- `src/components/admin-kpi/AdminContractKpiPanel.tsx`
- `src/components/contracts/AdminContractsWorkspace.tsx`
- `src/components/contracts/admin-contracts-analytics-context.ts` (new)
- `scripts/tests/e2e-wi0841-admin-analytics-contract-kpi-source-context-links.test.ts` (updated)
- `scripts/tests/e2e-wi0864-admin-contracts-analytics-return-focus-restore.test.ts` (new)

## Acceptance
1. Contract KPI panel links append `analyticsFocus` when the selected analytics focus is not `all`.
2. `/admin/contracts` parses `analyticsFocus` and builds analytics back href with `focus` query when valid.
3. Existing source banners and focus-queue label resolution keep working as before.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0841-admin-analytics-contract-kpi-source-context-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0842-admin-contracts-analytics-source-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0864-admin-contracts-analytics-return-focus-restore.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
