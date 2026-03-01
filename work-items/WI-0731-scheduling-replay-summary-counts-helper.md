# WI-0731 Scheduling Replay Summary Counts Helper

## Summary
- extracted replay summary-count builder into
  `buildScheduleAnomalyIncidentReplaySummaryCounts` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to reuse `replaySummary` when building
  generated audit payload and replay result.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0731-scheduling-replay-summary-counts-helper.test.ts`
- `npm.cmd run typecheck`
