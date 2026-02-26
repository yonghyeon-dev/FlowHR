# WI-0519: Admin Analytics Web Baseline and CSV Export

## Summary
- Goal: open a dedicated web analytics/report surface and enable CSV export from current KPI view.
- Scope:
  - `src/app/admin/analytics/page.tsx`
  - `src/app/admin/layout.tsx`
  - `src/lib/i18n/messages.ts`
  - `src/components/admin-kpi/AdminKpiDashboard.tsx`
  - `src/components/admin-kpi/copy.ts`
  - `scripts/tests/e2e-wi0519-admin-analytics-web-baseline-and-csv-export.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `/admin/analytics` route using existing KPI data pipeline in analytics mode.
- Extended admin navigation and i18n messages with analytics/report entry.
- Added analytics-mode copy set (`analyticsTitle`, `analyticsDescription`) and CSV export copy keys.
- Added CSV export action:
  - current trend rows + summary snapshot are exported as `flowhr-admin-analytics-*.csv`.
  - export completion is written to KPI API log feed for operator traceability.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0519-admin-analytics-web-baseline-and-csv-export.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0235-admin-kpi-dashboard-baseline.test.ts`
- [x] `npm.cmd run typecheck`
