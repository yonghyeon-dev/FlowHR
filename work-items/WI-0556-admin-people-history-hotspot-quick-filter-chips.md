# WI-0556: Admin People History Hotspot Quick-Filter Chips

## Summary
- Goal: make people history hotspot summary actionable by turning summary chips into quick field filters.
- Scope:
  - `src/app/admin/people/page-view-history-panel.tsx`
  - `scripts/tests/e2e-wi0556-admin-people-history-hotspot-quick-filter-chips.test.ts`
  - `ROADMAP.md`

## Delivery
- Converted history hotspot summary chip into interactive button controls.
- Wired chip click to `setHistoryFieldFilter(item.field)` for one-click history narrowing.
- Preserved existing panel line-budget guard.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0556-admin-people-history-hotspot-quick-filter-chips.test.ts`
