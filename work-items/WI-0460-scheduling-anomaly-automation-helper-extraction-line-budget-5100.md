# WI-0460: Scheduling Anomaly Automation Helper Extraction (Line Budget 5100)

## Summary
- Goal: Reduce `src/features/scheduling/service.ts` by extracting anomaly alert/escalation/ticket automation helper logic.
- Scope:
  - Extract env-flag parsing and escalation/ticket payload builder helpers.
  - Rewire scheduling service to use helper module imports.
  - Keep behavior unchanged while restoring a tighter line budget.

## Delivery
- Added `src/features/scheduling/anomaly-automation-helpers.ts`
  - `AnomalyEscalationSeverity` and helper input types
  - `isSchedulingAnomalyAlertsEnabled`
  - `isSchedulingAnomalyEscalationEnabled`
  - `isSchedulingAnomalyTicketAutomationEnabled`
  - `classifyAnomalyEscalationSeverity`
  - `anomalyEscalationSeverityWeight`
  - `parseAnomalySeverityFromEnv`
  - `parsePositiveIntegerRangeFromEnv`
  - `buildAnomalyAlertPayload`
  - `buildAnomalyEscalationPayload`
  - `buildAnomalyTicketRequestPayload`
- Updated `src/features/scheduling/service.ts`
  - Removed duplicated inline automation helper implementations.
  - Imported helper functions/types from the new module.
  - Line count reduced and guarded to <= 5100.
- Added `scripts/tests/e2e-wi0460-scheduling-anomaly-automation-helper-extraction-line-budget-5100.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0460-scheduling-anomaly-automation-helper-extraction-line-budget-5100.test.ts`
