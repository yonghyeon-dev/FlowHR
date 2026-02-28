# WI-0693 Scheduling listInPeriod Query Helper Extraction

## Summary
- extracted `listWorkSchedules` data-access query-input composition into
  `buildScheduleListInPeriodQueryInput` in
  `src/features/scheduling/schedule-list-query-helpers.ts`.
- rewired `src/features/scheduling/service.ts` list path to use helper-generated
  listInPeriod input.
- preserved schedule list behavior and tenant scope filtering.
- added WI-0693 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0693-scheduling-list-in-period-query-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0040-scheduling.test.ts`
- `npm.cmd run typecheck`
