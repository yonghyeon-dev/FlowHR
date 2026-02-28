# WI-0685 Scheduling Anomaly Summary Side-Effect Helper Adoption

## Summary
- added `emitAnomalySummarySideEffects` to
  `src/features/scheduling/anomaly-side-effect-helpers.ts` to combine
  alert + escalation side-effect execution for anomaly summary flows.
- rewired `listScheduleAttendanceAnomalies` in
  `src/features/scheduling/service.ts` to use the combined helper.
- preserved alert/escalation behavior and non-blocking side-effect semantics.
- added WI-0685 regression guard for helper adoption and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0685-scheduling-anomaly-summary-side-effect-helper-adoption.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0051-scheduling-anomaly-alert-automation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0055-scheduling-anomaly-escalation-policy.test.ts`
- `npm.cmd run typecheck`
