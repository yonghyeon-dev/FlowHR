# WI-0456: Scheduling Incident Audit Projection Extraction (Line Budget 5300)

## Summary
- Goal: Reduce `src/features/scheduling/service.ts` complexity by extracting audit projection constants/builders.
- Scope:
  - Extract anomaly incident lifecycle/archive/replay projection constants.
  - Extract audit-log -> read-model projection builder.
  - Rewire service imports without behavior changes.

## Delivery
- Added `src/features/scheduling/incident-audit-projection.ts`
  - `ANOMALY_INCIDENT_*` projection constants
  - `IncidentAuditProjectionLog` type
  - `buildScheduleAnomalyIncidentReadModelsFromAuditLogs`
- Updated `src/features/scheduling/service.ts`
  - Replaced inline constants/helpers with imports from the new module.
  - Line count reduced to 5254.
- Added `scripts/tests/e2e-wi0456-scheduling-incident-audit-projection-extraction-line-budget-5300.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0456-scheduling-incident-audit-projection-extraction-line-budget-5300.test.ts`
