# WI-0763 Admin Analytics Recruitment KPI Panel

## Summary
- added a recruitment KPI panel to `/admin/analytics`:
  - open opening count
  - active referral count
  - stalled referral count (7d+ without stage update)
- wired recruitment KPI snapshot loading into the existing admin analytics fetch cycle.
- kept admin KPI line budgets within guardrails by isolating recruitment panel logic in a dedicated component.

## Scope
- core product analytics enhancement only
- no ops/scheduler expansion
- no phase-style UI layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0763-admin-analytics-recruitment-kpi-panel.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0532-admin-analytics-focus-metric-filter-and-csv-alignment.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0543-admin-analytics-contract-sla-overdue-metric.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0562-admin-analytics-quick-drilldown-controls.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0592-admin-analytics-contract-decision-queue-kpi.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
