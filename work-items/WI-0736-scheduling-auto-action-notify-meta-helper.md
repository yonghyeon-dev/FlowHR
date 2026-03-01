# WI-0736 Scheduling Auto Action Notify Meta Helper

## Summary
- extracted notification meta normalization into
  `resolveScheduleAnomalyIncidentAutoActionNotificationMeta` in
  `src/features/scheduling/anomaly-incident-auto-action-helpers.ts`.
- rewired `executeScheduleAnomalyIncidentAutoAction` in
  `src/features/scheduling/service.ts` to pass the helper-built meta to
  `notifyScheduleAnomalyIncidentAutoActionExecution`.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0736-scheduling-auto-action-notify-meta-helper.test.ts`
- `npm.cmd run typecheck`
