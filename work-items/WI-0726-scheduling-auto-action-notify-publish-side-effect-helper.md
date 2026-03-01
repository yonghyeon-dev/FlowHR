# WI-0726 Scheduling Auto Action Notify Publish Side-Effect Helper

## Summary
- extracted auto-action executed event publisher callback builder into
  `buildScheduleAnomalyIncidentAutoActionExecutedEventPublisher` in
  `src/features/scheduling/anomaly-incident-auto-action-audit-helpers.ts`.
- rewired `executeScheduleAnomalyIncidentAutoAction` in
  `src/features/scheduling/service.ts` to use the helper instead of an inline
  `publishExecuted` side-effect callback.

## Scope
- scheduling helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0726-scheduling-auto-action-notify-publish-side-effect-helper.test.ts`
- `npm.cmd run typecheck`
