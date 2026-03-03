# WI-0841 Admin Analytics Contract KPI Source Context Links

## Summary
- Added analytics source-context query wiring to contract KPI panel action links.
- Contract quick actions and priority action now carry `source=admin-analytics`.
- Contract decision/SLA routes also include focused metric context for downstream queue handoff.

## Scope
- `src/components/admin-kpi/AdminContractKpiPanel.tsx`
- `scripts/tests/e2e-wi0841-admin-analytics-contract-kpi-source-context-links.test.ts` (new)

## Acceptance
1. Contract KPI panel action links include `source=admin-analytics`.
2. Decision queue and SLA overdue actions include corresponding `focusMetric` context.
3. Existing priority-action selection logic is preserved.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0841-admin-analytics-contract-kpi-source-context-links.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0832-admin-analytics-contract-priority-action-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
