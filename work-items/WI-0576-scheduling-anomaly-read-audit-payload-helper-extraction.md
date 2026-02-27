# WI-0576: Scheduling Anomaly Read Audit Payload Helper Extraction

## Summary
- Goal: simplify `getScheduleAnomalyIncident` by extracting read audit payload composition into read helpers.
- Scope:
  - `src/features/scheduling/anomaly-incident-read-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0576-scheduling-anomaly-read-audit-payload-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAnomalyIncidentReadAuditPayload` helper for incident read audit payload.
- Rewired `getScheduleAnomalyIncident` to use helper payload builder.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0576-scheduling-anomaly-read-audit-payload-helper-extraction.test.ts`

