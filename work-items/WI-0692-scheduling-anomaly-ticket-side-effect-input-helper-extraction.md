# WI-0692 Scheduling Anomaly Ticket Side-Effect Input Helper Extraction

## Summary
- extracted anomaly cockpit ticket side-effect input composition into
  `buildScheduleAnomalyTicketSideEffectInput` in
  `src/features/scheduling/anomaly-side-effect-helpers.ts`.
- rewired `listScheduleAttendanceAnomalyCockpit` in
  `src/features/scheduling/service.ts` to pass helper-generated ticket side-effect input.
- preserved ticket automation behavior.
- added WI-0692 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0692-scheduling-anomaly-ticket-side-effect-input-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0067-scheduling-anomaly-cockpit-ticket-automation.test.ts`
- `npm.cmd run typecheck`
