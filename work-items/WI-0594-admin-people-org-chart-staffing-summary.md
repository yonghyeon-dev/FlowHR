# WI-0594: Admin People Org Chart Staffing Summary

## Summary
- Goal: make organization chart staffing health visible without leaving `/admin/people`.
- Scope:
  - `src/app/admin/people/page-view-org-chart-panel.tsx`
  - `scripts/tests/e2e-wi0594-admin-people-org-chart-staffing-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added org chart summary metrics:
  - organizations/departments count
  - employee total with active/inactive split
  - unassigned organization/department employee counts
- Enhanced department row visibility with active/inactive count breakdown.
- Added explicit unassigned organization/department guidance labels in tree rows.
- Kept panel file line-budget bounded.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0594-admin-people-org-chart-staffing-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0520-admin-people-history-action-field-filters.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0544-admin-people-history-top-change-hotspot-summary.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0556-admin-people-history-hotspot-quick-filter-chips.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- [x] `npm.cmd run typecheck`
