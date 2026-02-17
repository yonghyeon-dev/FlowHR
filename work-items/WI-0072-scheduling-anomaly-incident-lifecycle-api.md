# WI-0072: Scheduling Anomaly Incident Lifecycle Command API

## Background and Problem

WI-0071 added streaming cockpit UI and incident automation signals.
Operators still need explicit lifecycle actions to move incidents through triage:

1. acknowledge that an incident is being handled
2. assign an owner
3. resolve with a standardized reason

Without command APIs, operations remain chat-driven and audit traceability is fragmented.

## Scope

### In Scope

- Add anomaly incident lifecycle command endpoints:
  - `POST /scheduling/anomalies/incidents/{incidentId}/ack`
  - `POST /scheduling/anomalies/incidents/{incidentId}/assign`
  - `POST /scheduling/anomalies/incidents/{incidentId}/resolve`
- Command validation rules:
  - `assign` requires non-empty `assigneeId`
  - `resolve` accepts optional `resolutionCode` (`FALSE_POSITIVE|ATTENDANCE_CORRECTED|MANUAL_CONFIRMED|OTHER`)
  - optional `note` field for all commands
- Append audit logs for each command action.
- Publish domain event `scheduling.anomaly.incident.updated.v1` for each lifecycle update.
- Keep command path operational-only (no scheduling/attendance/payroll mutation).

### Out of Scope

- Persistent incident table/state machine
- SLA timer/escalation scheduler
- External ticket provider state sync
- Incident list/read endpoint

## User Scenarios

1. Manager acknowledges an anomaly incident when triage begins.
2. Manager assigns an on-call owner to incident context.
3. Manager resolves incident with standardized resolution code for later analysis.
4. Employee role is denied for lifecycle command endpoints.

## Payroll Accuracy and Calculation Rules

- Lifecycle commands are operational metadata only.
- Payroll calculation/settlement behavior is unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Incident acknowledge | Allow | Allow | Deny | Allow |
| Incident assign | Allow | Allow | Deny | Allow |
| Incident resolve | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none
- Backward compatibility:
  - additive API/audit/event behavior only

## API and Event Changes

- Endpoints added:
  - `POST /scheduling/anomalies/incidents/{incidentId}/ack`
  - `POST /scheduling/anomalies/incidents/{incidentId}/assign`
  - `POST /scheduling/anomalies/incidents/{incidentId}/resolve`
- Events published:
  - `scheduling.anomaly.incident.updated.v1`
- Audit events:
  - `scheduling.anomaly.incident.acknowledged`
  - `scheduling.anomaly.incident.assigned`
  - `scheduling.anomaly.incident.resolved`

## Test Plan

- Unit:
  - action-to-state mapping and command payload validation
- Integration:
  - manager ack/assign/resolve success path
  - assign missing `assigneeId` returns 400
  - employee command request returns 403
  - command actions append audit and publish event
- Regression:
  - anomaly cockpit read/stream behavior unchanged
  - command path does not mutate schedule/attendance state
- Authorization:
  - scheduling write-any permission required
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.incident.acknowledged`
  - `scheduling.anomaly.incident.assigned`
  - `scheduling.anomaly.incident.resolved`
- Metrics:
  - `schedule_anomaly_incident_lifecycle_command_count` (optional)
- Alert conditions:
  - repeated command failure response spikes

## Rollback Plan

- API rollback:
  - revert command route/service changes
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
