# WI-0742 Scheduling Replay Audit List Input Helper

## Summary
- extracted replay audit-list query-input composition into
  `buildScheduleAnomalyIncidentReplayAuditListInput` in
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`.
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to call data-access audit list with the
  helper-built input.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0742-scheduling-replay-audit-list-input-helper.test.ts`
- `npm.cmd run typecheck`
