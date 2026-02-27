# WI-0574: Scheduling Anomaly Reconcile Summary/Result Helper Extraction

## Summary
- Goal: reduce orchestration density in `reconcileScheduleAnomalyIncidentStore` by extracting reconcile generated audit payload and result composition.
- Scope:
  - `src/features/scheduling/anomaly-incident-reconcile-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0574-scheduling-anomaly-reconcile-summary-result-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload` helper for reconciliation generated audit payload.
- Added `buildScheduleAnomalyIncidentReconcileResult` helper for reconciliation API response payload composition.
- Rewired `reconcileScheduleAnomalyIncidentStore` to delegate payload/result assembly to helper functions.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0574-scheduling-anomaly-reconcile-summary-result-helper-extraction.test.ts`

