# WI-0544: Admin People History Top-Change Hotspot Summary

## Summary
- Goal: accelerate people-admin decision making by surfacing the most frequently changed profile field in the current history view.
- Scope:
  - `src/app/admin/people/page-view-history-panel.tsx`
  - `scripts/tests/e2e-wi0544-admin-people-history-top-change-hotspot-summary.test.ts`
  - `ROADMAP.md`

## Delivery
- Added top hotspot summary row in HR history panel using existing `historyChangeSummary`.
- Displays highest-frequency changed field and count for the active filter result.
- Kept history panel line budget guard within threshold.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0520-admin-people-history-action-field-filters.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0544-admin-people-history-top-change-hotspot-summary.test.ts`

