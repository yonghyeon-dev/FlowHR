# WI-0543: Admin Analytics Contract SLA Overdue Metric

## Summary
- Goal: include contract SLA overdue pressure in admin analytics so backlog risk is visible in KPI trend and CSV export.
- Scope:
  - `src/components/admin-kpi/AdminKpiDashboard.tsx`
  - `src/components/admin-kpi/AdminKpiSections.tsx`
  - `src/components/admin-kpi/dashboard-utils.ts`
  - `src/components/admin-kpi/copy.ts`
  - `src/features/admin-kpi/summary.ts`
  - `scripts/tests/e2e-wi0543-admin-analytics-contract-sla-overdue-metric.test.ts`
  - `ROADMAP.md`

## Delivery
- Added contract document fetch in KPI load flow and computed SLA-overdue count for tracked statuses.
- Extended summary model with `contractSlaOverdueCount`.
- Added analytics focus option, KPI card, trend row, and CSV snapshot field for contract SLA overdue count.
- Extended localized copy keys for new metric label.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0532-admin-analytics-focus-metric-filter-and-csv-alignment.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0543-admin-analytics-contract-sla-overdue-metric.test.ts`

