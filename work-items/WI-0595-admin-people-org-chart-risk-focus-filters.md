# WI-0595: Admin People Org Chart Risk Focus Filters

## Summary
- Goal: let admins focus immediately on risky staffing subsets in org chart view.
- Scope:
  - `src/app/admin/people/page-view-org-chart-panel.tsx`
  - `scripts/tests/e2e-wi0594-admin-people-org-chart-staffing-summary.test.ts`
  - `scripts/tests/e2e-wi0595-admin-people-org-chart-risk-focus-filters.test.ts`
  - `ROADMAP.md`

## Delivery
- Added org chart focus mode toggles:
  - all
  - inactive employees only
  - unassigned org/department employees only
- Added per-mode visible count badges on filter buttons.
- Added filter-aware empty guidance when no row matches the selected mode.
- Extended summary model with unique unassigned employee count.
- Kept org chart panel within updated line-budget guard.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0594-admin-people-org-chart-staffing-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0595-admin-people-org-chart-risk-focus-filters.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0520-admin-people-history-action-field-filters.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0556-admin-people-history-hotspot-quick-filter-chips.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run lint`
- [x] `npm.cmd run typecheck`
