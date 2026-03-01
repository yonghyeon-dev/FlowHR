# WI-0746 Scheduling Reconcile Audit Read Input Helper

## Summary
- extracted reconcile audit read-input builder into
  `buildScheduleAnomalyIncidentReconcileAuditReadInput` in
  `src/features/scheduling/anomaly-incident-reconcile-helpers.ts`.
- rewired `reconcileScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to call
  `listScheduleAnomalyIncidentReadModelsFromAudit` with helper-built input.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0746-scheduling-reconcile-audit-read-input-helper.test.ts`
- `npm.cmd run typecheck`
