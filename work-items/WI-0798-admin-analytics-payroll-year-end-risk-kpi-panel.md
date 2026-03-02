# WI-0798 Admin Analytics Payroll Year-End Risk KPI Panel

## Background

- `/admin/analytics` already exposes recruitment/notices/onboarding/benefits snapshots.
- Payroll and year-end blockers are still scattered across payroll pages, so admin cannot see readiness risk in one view.

## Scope

- Add `AdminPayrollRiskKpiPanel` and `buildPayrollRiskKpiSnapshot` in `src/components/admin-kpi/AdminPayrollRiskKpiPanel.tsx`.
- Extend `AdminKpiDashboard` to load payroll risk data from:
  - `/api/payroll/runs`
- Render payroll risk panel in analytics mode with:
  - runs in period
  - previewed (unconfirmed) runs
  - confirmed but not distributed runs
  - distributed but not acknowledged runs
  - year-end readiness percent and blocking run count
- Add localized copy keys and regression guard.

## Acceptance Criteria

1. `/admin/analytics` shows payroll/year-end risk panel with readiness and blocker metrics.
2. Panel metrics are API-backed and scoped by actor session.
3. Regression test and roadmap/work-item links are updated.

## Notes

- Product analytics UI enhancement only.
- No API contract/schema change.
