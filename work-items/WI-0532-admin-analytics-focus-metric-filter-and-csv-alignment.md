# WI-0532: Admin Analytics Focus Metric Filter and CSV Alignment

## Summary
- Goal: improve analytics usability with a focus metric filter and ensure exported CSV reflects the same focused view.
- Scope:
  - `src/components/admin-kpi/AdminKpiDashboard.tsx`
  - `src/components/admin-kpi/AdminKpiSections.tsx`
  - `src/components/admin-kpi/copy.ts`
  - `src/components/admin-kpi/dashboard-utils.ts`
  - `scripts/tests/e2e-wi0532-admin-analytics-focus-metric-filter-and-csv-alignment.test.ts`
  - `ROADMAP.md`

## Delivery
- Added analytics focus metric selection (`all/pending/stalled/attendance/leave/payroll`).
- Added `AdminKpiAnalyticsControls` panel to keep dashboard logic compact.
- Filtered trend table rows by selected focus metric in analytics mode.
- Updated CSV payload generation to include selected focus metric and export only the visible trend rows.
- Kept `AdminKpiDashboard.tsx` and `AdminKpiSections.tsx` within `<=300` line budget guard.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0235-admin-kpi-dashboard-baseline.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0519-admin-analytics-web-baseline-and-csv-export.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0532-admin-analytics-focus-metric-filter-and-csv-alignment.test.ts`

