# WI-0831 Admin Analytics Contract KPI Panel

## Summary
- Added a dedicated contract lifecycle KPI panel to `/admin/analytics`.
- Extended analytics KPI range detail with contract response-pending and renewal-candidate counts.
- Added localized contract panel copy for ko/en runtime.

## Scope
- `src/components/admin-kpi/AdminContractKpiPanel.tsx` (new)
- `src/components/admin-kpi/AdminKpiDashboard.tsx`
- `src/components/admin-kpi/AdminKpiSections.tsx`
- `src/components/admin-kpi/copy.ts`
- `scripts/tests/e2e-wi0831-admin-analytics-contract-kpi-panel.test.ts` (new)

## Acceptance
1. `/admin/analytics` shows contract lifecycle snapshot cards for decision queue, pending response, SLA overdue, and renewal candidates.
2. Contract snapshot uses current period KPI context without adding separate API calls.
3. Contract panel labels are localized for ko/en.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0831-admin-analytics-contract-kpi-panel.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0798-admin-analytics-payroll-year-end-risk-kpi-panel.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
