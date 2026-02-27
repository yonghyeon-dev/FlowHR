# WI-0562: Admin Analytics Quick Drilldown Controls

## Summary
- Goal: let admins switch KPI focus metric in one click during analytics review.
- Scope:
  - `src/components/admin-kpi/AdminKpiSections.tsx`
  - `src/components/admin-kpi/copy.ts`
  - `scripts/tests/e2e-wi0562-admin-analytics-quick-drilldown-controls.test.ts`
  - `ROADMAP.md`

## Delivery
- Added quick drilldown button group in analytics controls (`all` + per-metric shortcuts).
- Extended ko/en KPI copy with drilldown label and reset action key.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0562-admin-analytics-quick-drilldown-controls.test.ts`
