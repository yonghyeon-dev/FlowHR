# WI-0578: Scheduling Anomaly Lifecycle Audit/Response Helper Extraction

## Summary
- Goal: simplify `updateScheduleAnomalyIncidentLifecycle` by extracting lifecycle audit payload and service response composition to core helpers.
- Scope:
  - `src/features/scheduling/anomaly-incident-core-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0578-scheduling-anomaly-lifecycle-audit-response-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildAnomalyIncidentLifecycleAuditPayload` helper for lifecycle audit/event payload composition.
- Added `buildAnomalyIncidentLifecycleResponse` helper for lifecycle API response composition.
- Rewired `updateScheduleAnomalyIncidentLifecycle` to delegate payload/result assembly.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0578-scheduling-anomaly-lifecycle-audit-response-helper-extraction.test.ts`

