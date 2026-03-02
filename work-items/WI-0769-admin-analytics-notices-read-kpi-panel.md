# WI-0769 Admin Analytics Notices Read KPI Panel

## Summary
- added a notices read coverage KPI panel to `/admin/analytics`:
  - published notice count
  - no-read notice count (published notices with zero read receipts)
  - unread aging count (3d+ no-read published notices)
- wired notices/read-receipts snapshot loading into the existing admin analytics fetch cycle.
- kept KPI summary/trend baseline untouched and added the notices KPI as a dedicated analytics panel.

## Scope
- core product analytics enhancement only
- no ops/scheduler expansion
- no phase-style UI layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0769-admin-analytics-notices-read-kpi-panel.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0763-admin-analytics-recruitment-kpi-panel.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0532-admin-analytics-focus-metric-filter-and-csv-alignment.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0543-admin-analytics-contract-sla-overdue-metric.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0592-admin-analytics-contract-decision-queue-kpi.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
