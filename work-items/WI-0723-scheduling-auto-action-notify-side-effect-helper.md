# WI-0723 Scheduling Auto Action Notify Side-Effect Helper

## Summary
- extracted notify audit append callback builder into
  `buildScheduleAnomalyIncidentAutoActionNotificationAuditAppender` in
  `src/features/scheduling/anomaly-incident-auto-action-audit-helpers.ts`.
- rewired `executeScheduleAnomalyIncidentAutoAction` in
  `src/features/scheduling/service.ts` to pass the helper-generated callback to
  `notifyScheduleAnomalyIncidentAutoActionExecution`.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0723-scheduling-auto-action-notify-side-effect-helper.test.ts`
- `npm.cmd run typecheck`
