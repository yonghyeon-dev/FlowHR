# WI-0067: Scheduling Anomaly Cockpit Ticket Automation Baseline

## Background and Problem

WI-0065 introduced a tenant-level anomaly cockpit for triage, but operator ticket creation is still manual.
This causes delayed response when critical/no-show anomalies accumulate.

Phase 2 needs a minimal automation bridge that requests operator tickets from cockpit results without blocking read responses.

## Scope

### In Scope

- Extend cockpit automation behavior behind feature flag:
  - `FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED`
- Add ticket automation policy controls:
  - `FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY` (`MINOR|MAJOR|CRITICAL`, default `CRITICAL`)
  - `FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN` (default `20`, range `1..200`)
- When enabled and queue has matching anomalies, emit domain event:
  - `scheduling.anomaly.ticket.requested.v1`
- Add audit logs:
  - success: `scheduling.anomaly.ticket.requested`
  - failure (including invalid config): `scheduling.anomaly.ticket.request.failed`
- Preserve cockpit endpoint response shape and existing authorization.

### Out of Scope

- External ticket provider adapter (Jira/ServiceNow/etc.)
- Ticket lifecycle state machine
- Persistent dedup/cooldown store for ticket requests
- Streaming transport (SSE/WebSocket)

## User Scenarios

1. Manager queries cockpit and receives summary as before; when automation is enabled, critical anomalies trigger ticket request events.
2. Manager sets severity threshold to `MAJOR` and only `MAJOR/CRITICAL` queue items are requested.
3. Invalid automation config does not fail cockpit response; failure is captured in audit.

## Payroll Accuracy and Calculation Rules

- Ticket automation is operational side-effect only.
- Payroll aggregation/calculation outputs remain unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Cockpit query + ticket request side-effect | Allow | Allow | Deny | Allow |
| Manual ticket state mutation | N/A | N/A | N/A | N/A |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime event/audit behavior only)
- Backward compatibility:
  - additive event/audit behavior only

## API and Event Changes

- Endpoint behavior updated:
  - `GET /scheduling/anomalies/cockpit` (non-blocking ticket side-effect)
- Events published:
  - `scheduling.anomaly.ticket.requested.v1`
- Audit events:
  - `scheduling.anomaly.ticket.requested`
  - `scheduling.anomaly.ticket.request.failed`

## Test Plan

- Unit:
  - severity threshold filtering (`MINOR|MAJOR|CRITICAL`)
  - `maxPerRun` limit enforcement
- Integration:
  - automation enabled emits `scheduling.anomaly.ticket.requested.v1`
  - automation disabled emits no ticket event
  - invalid automation config keeps cockpit `200` and appends failure audit
- Regression:
  - cockpit report remains read-only and does not mutate schedule/attendance state
  - existing anomaly alert/escalation automation behavior remains unchanged
- Authorization:
  - employee role remains denied for cockpit endpoint (403)
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.ticket.requested`
  - `scheduling.anomaly.ticket.request.failed`
- Metrics:
  - `schedule_anomaly_ticket_request_count` (optional)
  - `schedule_anomaly_ticket_request_failed_count` (optional)
- Alert conditions:
  - repeated ticket request failure in cockpit query window

## Rollback Plan

- Feature toggle:
  - set `FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED=false`
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
