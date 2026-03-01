# WI-0716 Scheduling Anomaly SLA Query Helper Extraction

## Summary
- extracted schedule anomaly SLA query-input normalization into
  `src/features/scheduling/anomaly-incident-sla-query-helpers.ts`.
- rewired `listScheduleAnomalyIncidentSla` in `src/features/scheduling/service.ts`
  to consume a single helper output (`topN`, `assigneeId`, `includeResolved`, SLA thresholds, and `asOf`).
- preserved existing behavior while reducing inline normalization logic in service.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0716-scheduling-anomaly-sla-query-helper-extraction.test.ts`
- `npm.cmd run typecheck`
