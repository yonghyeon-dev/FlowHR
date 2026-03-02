# WI-0796 Admin Analytics Onboarding KPI Panel

## Background

- `/admin/analytics` already provides KPI panels for recruitment and notices, but onboarding execution visibility is missing.
- Admins need a single analytics view to identify onboarding bottlenecks (invite coverage and contract response lag).

## Scope

- Add onboarding KPI snapshot builder/panel in `src/components/admin-kpi/AdminOnboardingKpiPanel.tsx`.
- Extend `AdminKpiDashboard` to load onboarding metrics from:
  - `/api/people/employees` (active employees)
  - `/api/auth/invites` (employee invites)
  - `/api/contracts/documents` (contract response coverage)
- Render onboarding panel only in analytics mode.
- Add localized copy keys and regression guard.

## Acceptance Criteria

1. `/admin/analytics` shows onboarding KPI panel with invite coverage, contract response coverage, and readiness score.
2. Onboarding KPI is API-backed and organization-scoped.
3. Regression test and roadmap/work-item links are updated.

## Notes

- Product analytics surface enhancement only.
- No API contract/schema change.
