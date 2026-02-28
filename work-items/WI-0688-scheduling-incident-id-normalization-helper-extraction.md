# WI-0688 Scheduling IncidentId Normalization Helper Extraction

## Summary
- extracted `incidentId` trim/required validation into
  `normalizeRequiredIncidentId` in
  `src/features/scheduling/anomaly-service-context-helpers.ts`.
- rewired `updateScheduleAnomalyIncidentLifecycle` in
  `src/features/scheduling/service.ts` to use the shared helper.
- preserved input validation semantics.
- added WI-0688 regression guard for helper extraction and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0688-scheduling-incident-id-normalization-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0072-scheduling-anomaly-incident-lifecycle.test.ts`
- `npm.cmd run typecheck`
