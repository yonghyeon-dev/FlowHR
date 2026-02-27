# WI-0592: Admin Analytics Contract Decision Queue KPI

## Summary
- Goal: make contract decision backlog visible in admin analytics for faster triage.
- Scope:
  - `src/features/admin-kpi/summary.ts`
  - `src/components/admin-kpi/AdminKpiDashboard.tsx`
  - `src/components/admin-kpi/AdminKpiSections.tsx`
  - `src/components/admin-kpi/dashboard-utils.ts`
  - `src/components/admin-kpi/copy.ts`
  - `scripts/tests/e2e-wi0592-admin-analytics-contract-decision-queue-kpi.test.ts`
  - `ROADMAP.md`

## Delivery
- Added new KPI metric `contractDecisionQueueCount` to admin KPI summary model.
- Added analytics aggregation for contract decision queue:
  - uses contract next-step policy (`REQUEST_APPROVAL`, `APPROVE_OR_REJECT`, `SEND_DOCUMENT`)
  - counts documents requiring admin decision actions
- Added metric to:
  - KPI cards
  - focus metric select + quick drilldown
  - trend rows
  - CSV snapshot export
- Kept line budgets stable:
  - `AdminKpiDashboard.tsx <= 300`
  - `AdminKpiSections.tsx <= 300`

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0592-admin-analytics-contract-decision-queue-kpi.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0235-admin-kpi-dashboard-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0562-admin-analytics-quick-drilldown-controls.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0543-admin-analytics-contract-sla-overdue-metric.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
