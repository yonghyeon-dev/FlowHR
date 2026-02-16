# WI-0051: Scheduling Anomaly Alert Automation Baseline

## Background and Problem

WI-0045 introduced read-only schedule-to-attendance anomaly reporting (`LATE`, `NO_SHOW`), but no automated signal is emitted for downstream alerting/escalation.

Phase 2 requires a minimal automation baseline so anomaly detection can trigger event-driven notifications without blocking report API behavior.

## Scope

### In Scope

- Add feature-flagged anomaly alert automation:
  - `FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED=true`
- When enabled and anomalies exist, emit domain event:
  - `scheduling.anomaly.detected.v1`
- Add audit trail for alert trigger:
  - `scheduling.anomaly.alert.triggered`
- Keep anomaly report response contract unchanged (read-only).
- Ensure alert publication failure does not break report API path.

### Out of Scope

- Multi-channel routing policy (Slack/Discord/Email priority)
- Escalation chain and retry policy orchestration
- Auto-penalty or payroll mutation based on anomaly signal

## User Scenarios

1. Manager queries anomaly report and receives normal response.
2. When flag is enabled and anomalies are detected, automation event is emitted once per report query.
3. When flag is disabled, no anomaly alert event is emitted.
4. Alert publication failure is logged/audited but report response remains successful.

## Payroll Accuracy and Calculation Rules

- Alert automation is read-only and does not modify attendance/schedule/payroll state.
- Existing payroll pipeline remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| List anomaly report | Allow | Allow (employeeId required) | Own only | Allow |
| Trigger anomaly alert automation | Allow | Allow | Own only | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - `WorkSchedule`
  - `AttendanceRecord`
  - `AuditLog`
- Migration IDs:
  - none (runtime event/audit automation only)
- Backward compatibility:
  - additive event/audit behavior behind feature flag

## API and Event Changes

- Endpoint behavior update:
  - `GET /scheduling/anomalies` emits automation event when enabled and anomalies detected
- Events published:
  - `scheduling.anomaly.detected.v1`
- Events consumed:
  - none

## Test Plan

- Unit:
  - anomaly alert flag parsing
  - alert payload shaping
- Integration:
  - flag enabled + anomalies -> event emitted and audit trigger logged
  - flag disabled -> no alert event emitted
  - report API remains successful when automation path is skipped
- Regression:
  - WI-0045 anomaly report behavior and role boundaries unchanged
- Authorization:
  - existing anomaly report permission model unchanged
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.report.generated`
  - `scheduling.anomaly.alert.triggered`
  - `scheduling.anomaly.alert.failed` (optional)
- Metrics:
  - `schedule_anomaly_alert_triggered_count` (optional)
  - `schedule_anomaly_alert_failed_count` (optional)
- Alert conditions:
  - none (this WI provides signal, not escalation policy)

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED=false`
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
