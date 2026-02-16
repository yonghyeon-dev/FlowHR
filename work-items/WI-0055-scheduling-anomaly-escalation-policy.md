# WI-0055: Scheduling Anomaly Escalation Policy Baseline

## Background and Problem

Scheduling anomaly automation (WI-0051) emits a detected event when anomalies exist, but it does not classify severity or route ownership for incident handling.

Phase 2 needs a baseline escalation policy so anomaly events can carry actionable severity/owner/retry metadata while remaining non-blocking.

## Scope

### In Scope

- Add feature-flag based anomaly escalation automation:
  - `FLOWHR_SCHEDULING_ANOMALY_ESCALATION_ENABLED=true`
- Add routing/retry config via environment:
  - `FLOWHR_SCHEDULING_ANOMALY_ESCALATION_POLICY` (`MINOR:owner,MAJOR:owner,CRITICAL:owner`)
  - `FLOWHR_SCHEDULING_ANOMALY_ESCALATION_RETRY_MAX`
  - `FLOWHR_SCHEDULING_ANOMALY_ESCALATION_RETRY_BACKOFF_SECONDS`
- Emit escalation event `scheduling.anomaly.escalated.v1` when anomalies exist and escalation flag is enabled.
- Append escalation audit logs:
  - `scheduling.anomaly.escalation.triggered`
  - `scheduling.anomaly.escalation.failed`
- Keep anomaly report API response non-blocking even when escalation emission fails.

### Out of Scope

- Multi-channel notification fan-out orchestration (Slack/SMS/phone)
- Persistent escalation queue storage and dedup engine
- Human approval workflow for escalation handoff

## User Scenarios

1. Manager reads anomaly report with escalation flag enabled and anomalies present; escalation event is emitted with severity/owner/retry metadata.
2. Escalation severity is `CRITICAL` when `NO_SHOW` exists, `MAJOR` when late volume is high, otherwise `MINOR`.
3. Manager reads anomaly report with escalation flag disabled; escalation event is not emitted.
4. Escalation publish failure does not fail anomaly report API response.

## Payroll Accuracy and Calculation Rules

- Scheduling anomaly escalation remains informational only.
- No payroll minute/amount mutation is introduced by this policy.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Trigger anomaly escalation side-effect on anomaly report | Allow | Allow | Own-only report read path | Allow |
| Schedule/template/rotation mutation | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime event/audit behavior only)
- Backward compatibility:
  - default flag off, no behavior change until enabled

## API and Event Changes

- Endpoint behavior update:
  - `GET /scheduling/anomalies` may emit escalation side-effects when flag enabled
- Events published:
  - `scheduling.anomaly.escalated.v1`
- Events consumed:
  - none

## Test Plan

- Unit:
  - escalation routing config parse/validation
  - severity classification boundaries
  - retry config parse/validation
- Integration:
  - escalation-enabled anomaly report emits escalation event and audit trigger
  - escalation-disabled anomaly report emits no escalation event
  - escalation failure path appends failed audit and keeps API response successful
- Regression:
  - WI-0051 anomaly alert automation remains unchanged
- Authorization:
  - anomaly report role boundaries unchanged
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.escalation.triggered`
  - `scheduling.anomaly.escalation.failed`
- Metrics:
  - `schedule_anomaly_escalation_triggered_count` (optional)
  - `schedule_anomaly_escalation_failed_count` (optional)
- Alert conditions:
  - optional follow-up in operations workflow

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_SCHEDULING_ANOMALY_ESCALATION_ENABLED=false`
- DB rollback:
  - none
- Recovery target:
  - < 15m

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.
