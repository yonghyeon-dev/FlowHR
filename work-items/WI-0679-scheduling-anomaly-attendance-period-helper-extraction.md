# WI-0679 Scheduling Anomaly Attendance-Period Helper Extraction

## Summary
- extracted anomaly attendance lookup window expansion (`periodStart-1d`, `periodEnd+1d`)
  from `src/features/scheduling/service.ts` into:
  - `src/features/scheduling/anomaly-attendance-period-helpers.ts`
- rewired both anomaly report and anomaly cockpit flows to use the helper.
- preserved anomaly/cockpit query behavior.
- added WI-0679 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0679-scheduling-anomaly-attendance-period-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0045-scheduling-anomaly-report.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0065-scheduling-anomaly-cockpit-dashboard.test.ts`
- `npm.cmd run typecheck`
