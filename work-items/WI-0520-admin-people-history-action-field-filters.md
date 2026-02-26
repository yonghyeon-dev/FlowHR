# WI-0520: Admin People History Action/Field Filters

## Summary
- Goal: make HR history review actionable by filtering cards by action type and changed profile field.
- Scope:
  - `src/app/admin/people/page.tsx`
  - `src/app/admin/people/page-view.tsx`
  - `src/app/admin/people/page-view-history-panel.tsx`
  - `src/app/admin/people/page-types.ts`
  - `scripts/tests/e2e-wi0520-admin-people-history-action-field-filters.test.ts`
  - `ROADMAP.md`

## Delivery
- Added history filter state in admin people page:
  - action filter: `all | employee.created | employee.profile.updated`
  - field filter: `all | organizationId | departmentId | positionId | name | email | active`
- Added filtered history projection (`filteredHistory`) and switched change-summary counters to filtered data.
- Extended history panel UI:
  - action filter selector
  - changed-field selector
  - visible-history count (`visible / total`)
  - history card list now renders filtered set.
- Kept line budgets green:
  - `admin/people/page.tsx <= 420`
  - `admin/people/page-view.tsx <= 300`
  - `admin/people/page-view-history-panel.tsx <= 220`

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0520-admin-people-history-action-field-filters.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0455-admin-people-page-view-panel-decomposition-line-budget-300.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0505-admin-people-directory-actions-hook-extraction-line-budget-margin.test.ts`
- [x] `npm.cmd run typecheck`
