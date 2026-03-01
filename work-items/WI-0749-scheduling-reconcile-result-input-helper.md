# WI-0749 Scheduling Reconcile Result Input Helper

## Summary
- extracted reconcile result-input assembly into
  `buildScheduleAnomalyIncidentReconcileResultInputFromMetaAndRows` in
  `src/features/scheduling/anomaly-incident-reconcile-helpers.ts`.
- rewired `reconcileScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to build result input through helper.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0749-scheduling-reconcile-result-input-helper.test.ts`
- `npm.cmd run typecheck`
