# WI-0725 Scheduling Auto Action Notify Event Payload Helper

## Summary
- extracted auto-action executed event payload composition into
  `buildScheduleAnomalyIncidentAutoActionExecutedEventPayload` in
  `src/features/scheduling/anomaly-incident-auto-action-helpers.ts`.
- rewired `notifyScheduleAnomalyIncidentAutoActionExecution` to publish the
  helper-built payload instead of composing the event object inline.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0725-scheduling-auto-action-notify-event-payload-helper.test.ts`
- `npm.cmd run typecheck`
