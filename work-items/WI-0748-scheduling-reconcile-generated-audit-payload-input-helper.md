# WI-0748 Scheduling Reconcile Generated Audit Payload Input Helper

## Summary
- extracted reconcile generated-audit payload input assembly into
  `buildScheduleAnomalyIncidentReconcileGeneratedAuditPayloadInputFromMetaAndSummary`
  in `src/features/scheduling/anomaly-incident-reconcile-helpers.ts`.
- rewired `reconcileScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to pass helper-built input into
  `buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload`.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0748-scheduling-reconcile-generated-audit-payload-input-helper.test.ts`
- `npm.cmd run typecheck`
