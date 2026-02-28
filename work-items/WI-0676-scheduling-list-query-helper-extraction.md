# WI-0676 Scheduling List Query Helper Extraction

## Summary
- extracted `listWorkSchedules` permission-aware employee-filter resolution from
  `src/features/scheduling/service.ts` into:
  - `src/features/scheduling/schedule-list-query-helpers.ts`
- moved schedule list access branching (`list-any`, `list-by-employee`, `list-own`)
  into helper and kept permission error semantics unchanged.
- rewired `listWorkSchedules` to delegate filter resolution to helper.
- added WI-0676 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0676-scheduling-list-query-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0040-scheduling.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0662-scheduling-editable-schedule-overlap-helper-extraction.test.ts`
- `npm.cmd run typecheck`
