# WI-0571: Scheduling Anomaly Auto-Action Audit Entry Helper Extraction

## Summary
- Goal: reduce audit object assembly noise in `executeScheduleAnomalyIncidentAutoAction` by extracting audit entry builders into a dedicated helper file.
- Scope:
  - `src/features/scheduling/anomaly-incident-auto-action-audit-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0571-scheduling-anomaly-auto-action-audit-entry-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added dedicated auto-action audit entry builders:
  - `buildScheduleAnomalyIncidentAutoActionAssignFailedAuditEntry`
  - `buildScheduleAnomalyIncidentAutoActionGeneratedAuditEntry`
  - `buildScheduleAnomalyIncidentAutoActionExecutionAuditEntry`
- Rewired auto-action execution flow in `service.ts` to use helper-built audit entries for:
  - assign failure audit append
  - generated summary audit append
  - execution notification audit append callback

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0571-scheduling-anomaly-auto-action-audit-entry-helper-extraction.test.ts`

