# WI-0729 Scheduling Replay Notification Audit Payload Helper

## Summary
- extracted replay audit entry helpers into
  `src/features/scheduling/anomaly-incident-replay-helpers.ts`:
  - `buildScheduleAnomalyIncidentReplayedAuditEntry`
  - `buildScheduleAnomalyIncidentReplayGeneratedAuditEntry`
- rewired `replayScheduleAnomalyIncidentStore` in
  `src/features/scheduling/service.ts` to use helper-built audit entries for
  per-incident replay and replay-generated summary logs.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0729-scheduling-replay-notification-audit-payload-helper.test.ts`
- `npm.cmd run typecheck`
