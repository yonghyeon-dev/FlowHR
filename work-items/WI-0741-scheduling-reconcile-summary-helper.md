# WI-0741 Scheduling Reconcile Summary Helper

## Summary
- extracted reconcile meta and summary composition into
  `resolveScheduleAnomalyIncidentReconcileMeta` and
  `buildScheduleAnomalyIncidentReconcileSummary` in
  `src/features/scheduling/anomaly-incident-reconcile-helpers.ts`.
- rewired `reconcileScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to reuse helper-built meta/summary for
  generated audit payload and result response.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0741-scheduling-reconcile-summary-helper.test.ts`
- `npm.cmd run typecheck`
