# WI-0747 Scheduling Reconcile Snapshot Input Helper

## Summary
- extracted reconcile snapshot-input builder into
  `buildScheduleAnomalyIncidentReconcileSnapshotInputFromRows` in
  `src/features/scheduling/anomaly-incident-reconcile-helpers.ts`.
- rewired `reconcileScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to call snapshot builder with
  helper-composed input.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0747-scheduling-reconcile-snapshot-input-helper.test.ts`
- `npm.cmd run typecheck`
