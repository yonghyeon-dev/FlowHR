# WI-0569: Scheduling Anomaly Escalation Request Payload Helper Extraction

## Summary
- Goal: further simplify `triggerScheduleAnomalyIncidentEscalation` in `scheduling/service.ts` by extracting request/failure payload composition.
- Scope:
  - `src/features/scheduling/anomaly-incident-escalation-helpers.ts`
  - `src/features/scheduling/service.ts`
  - `scripts/tests/e2e-wi0569-scheduling-anomaly-escalation-request-payload-helper-extraction.test.ts`
  - `ROADMAP.md`

## Delivery
- Added `buildScheduleAnomalyIncidentEscalationRequestPayload` helper for escalation requested event/audit payload.
- Added `buildScheduleAnomalyIncidentEscalationRequestFailedPayload` helper for escalation request failure audit payload.
- Rewired escalation request execution block in `service.ts` to delegate payload assembly to helpers.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0569-scheduling-anomaly-escalation-request-payload-helper-extraction.test.ts`

