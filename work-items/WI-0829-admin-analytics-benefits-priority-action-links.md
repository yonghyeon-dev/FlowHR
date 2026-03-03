# WI-0829 Admin Analytics Benefits Priority Action Links

## Summary
- Added priority-action decision logic to the admin analytics benefits KPI panel.
- Added quick action links for benefits workspace, pending-aging queue, and over-limit queue.
- Extended analytics copy keys (ko/en) for benefits priority reasons and action labels.

## Scope
- `src/components/admin-kpi/AdminBenefitsKpiPanel.tsx`
- `src/components/admin-kpi/copy.ts`
- `scripts/tests/e2e-wi0829-admin-analytics-benefits-priority-action-links.test.ts` (new)

## Acceptance
1. Benefits KPI panel exposes top-priority action using pending-aging/over-limit/submitted queue order.
2. Benefits KPI panel exposes quick action links for workspace and risk queues.
3. Copy keys for benefits priority actions/reasons are available in both ko/en locales.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0829-admin-analytics-benefits-priority-action-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0797-admin-analytics-benefits-kpi-panel.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
