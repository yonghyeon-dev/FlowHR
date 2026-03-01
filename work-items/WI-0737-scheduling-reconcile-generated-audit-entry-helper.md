# WI-0737 Scheduling Reconcile Generated Audit Entry Helper

## Summary
- extracted reconcile generated audit-entry envelope into
  `buildScheduleAnomalyIncidentReconcileGeneratedAuditEntry` in
  `src/features/scheduling/anomaly-incident-reconcile-helpers.ts`.
- rewired `reconcileScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to append the helper-built audit entry.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0737-scheduling-reconcile-generated-audit-entry-helper.test.ts`
- `npm.cmd run typecheck`
