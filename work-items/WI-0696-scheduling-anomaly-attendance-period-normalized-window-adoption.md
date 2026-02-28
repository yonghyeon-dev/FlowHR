# WI-0696 Scheduling Anomaly Attendance-Period Normalized-Window Adoption

## Summary
- rewired anomaly report/cockpit attendance-period expansion calls in
  `src/features/scheduling/service.ts` to pass `normalizedWindow.periodStart/periodEnd`
  into `buildAnomalyAttendancePeriodWindow`.
- aligned attendance-period expansion path with already-normalized window inputs.
- preserved anomaly report/cockpit behavior.
- added WI-0696 regression guard for normalized-window adoption and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0696-scheduling-anomaly-attendance-period-normalized-window-adoption.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0045-scheduling-anomaly-report.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0065-scheduling-anomaly-cockpit-dashboard.test.ts`
- `npm.cmd run typecheck`
