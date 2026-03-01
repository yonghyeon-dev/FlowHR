# WI-0724 Scheduling Auto Action Notify Audit Payload Helper

## Summary
- extracted notify audit payload builder into
  `buildScheduleAnomalyIncidentAutoActionNotificationAuditPayload` in
  `src/features/scheduling/anomaly-incident-auto-action-helpers.ts`.
- rewired `notifyScheduleAnomalyIncidentAutoActionExecution` success/failure
  audit branches to reuse the helper and remove duplicated payload literals.

## Scope
- scheduling service helper extraction only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0724-scheduling-auto-action-notify-audit-payload-helper.test.ts`
- `npm.cmd run typecheck`
