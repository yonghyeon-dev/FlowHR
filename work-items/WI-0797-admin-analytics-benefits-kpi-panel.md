# WI-0797 Admin Analytics Benefits KPI Panel

## Background

- `/admin/analytics` currently covers recruitment/notices/onboarding snapshots, but benefits approval queue risk is not visible.
- Benefits requests can stall or exceed policy limits without a single KPI summary surface.

## Scope

- Add `AdminBenefitsKpiPanel` and `buildBenefitsKpiSnapshot` in `src/components/admin-kpi/AdminBenefitsKpiPanel.tsx`.
- Extend `AdminKpiDashboard` to load benefits metrics from:
  - `/api/benefits/catalog`
  - `/api/benefits/requests`
- Render benefits panel in analytics mode with:
  - submitted/approved/rejected counts
  - 3-day aging submitted risk count
  - over-limit submitted request count
- Add localized copy keys and regression guard.

## Acceptance Criteria

1. `/admin/analytics` shows benefits KPI panel with queue status and risk indicators.
2. Panel metrics are API-backed and organization-scoped.
3. Regression test and roadmap/work-item links are updated.

## Notes

- Product analytics UI enhancement only.
- No API contract/schema change.
