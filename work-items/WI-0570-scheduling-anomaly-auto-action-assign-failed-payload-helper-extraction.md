# WI-0570: Scheduling Anomaly Auto-Action Assign-Failed Payload Helper Extraction

## Summary
- Goal: simplify `executeScheduleAnomalyIncidentAutoAction` in `scheduling/service.ts` by extracting assign-failure audit payload composition.
- Scope:
  - `src/features/scheduling/anomaly-incident-auto-action-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0570-scheduling-anomaly-auto-action-assign-failed-payload-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAnomalyIncidentAutoActionAssignFailedPayload` helper for `auto_action.assign.failed` audit payload assembly.
- Rewired `executeScheduleAnomalyIncidentAutoAction` failure path to use helper payload builder instead of inline object.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0570-scheduling-anomaly-auto-action-assign-failed-payload-helper-extraction.test.ts`

