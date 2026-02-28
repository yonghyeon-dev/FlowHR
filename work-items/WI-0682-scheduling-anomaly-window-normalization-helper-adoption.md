# WI-0682 Scheduling Anomaly Window Normalization Helper Adoption

## Summary
- added anomaly-window normalization helper APIs to
  `src/features/scheduling/schedule-input-normalization-helpers.ts`:
  - `normalizeScheduleAnomalyReportWindowInput`
  - `normalizeScheduleAnomalyCockpitWindowInput`
- rewired scheduling service anomaly report/cockpit paths to use normalized window
  input outputs instead of duplicating period/threshold/topN normalization steps.
- preserved anomaly report and cockpit behavior.
- added WI-0682 regression guard for helper adoption and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0682-scheduling-anomaly-window-normalization-helper-adoption.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0045-scheduling-anomaly-report.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0065-scheduling-anomaly-cockpit-dashboard.test.ts`
- `npm.cmd run typecheck`
