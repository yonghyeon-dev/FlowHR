# WI-0832 Admin Analytics Contract Priority Action Links

## Summary
- Added priority-action decision logic to the admin analytics contract KPI panel.
- Added quick action links for contracts workspace, decision queue, pending response queue, and SLA overdue queue.
- Extended contract analytics copy keys (ko/en) for action labels and priority reasons.

## Scope
- `src/components/admin-kpi/AdminContractKpiPanel.tsx`
- `src/components/admin-kpi/copy.ts`
- `scripts/tests/e2e-wi0832-admin-analytics-contract-priority-action-links.test.ts` (new)

## Acceptance
1. Contract KPI panel shows top-priority action based on SLA overdue, pending response, decision queue, and renewal candidate order.
2. Contract KPI panel exposes quick links to contracts queue routes.
3. Contract priority action labels/reasons are localized for ko/en.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0832-admin-analytics-contract-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0831-admin-analytics-contract-kpi-panel.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
