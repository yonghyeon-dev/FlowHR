# WI-0073: Scheduling Anomaly Incident Read-Model API

## Background and Problem

WI-0072 introduced anomaly incident lifecycle commands (`ack/assign/resolve`), but operators still lack a query API to view incident state and timeline history.

Without read-model endpoints, cockpit UI cannot show current incident queue state and action traceability in one place.

## Scope

### In Scope

- Add anomaly incident read-model endpoints:
  - `GET /scheduling/anomalies/incidents`
  - `GET /scheduling/anomalies/incidents/{incidentId}`
- Query capabilities:
  - `state` filter (`ACKNOWLEDGED|ASSIGNED|RESOLVED`)
  - `assigneeId` filter
  - bounded `topN` (`1..200`)
- Return lifecycle timeline history per incident.
- Enforce tenant-aware visibility and no-leak `404` for cross-tenant detail access.
- Append audit logs for list/detail reads.

### Out of Scope

- Persistent DB-backed incident table
- SLA timers and escalation schedule
- Incident search across date/time windows
- Incident analytics dashboard aggregation

## User Scenarios

1. Manager lists active anomaly incidents and filters by state/assignee.
2. Manager opens one incident and reviews lifecycle timeline (`ack -> assign -> resolve`).
3. Employee role is denied for incident list/detail APIs.
4. Cross-tenant incident id access returns `404`.

## Payroll Accuracy and Calculation Rules

- Incident read-model APIs are operational projections only.
- Payroll calculation and settlement behavior is unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Incident read-model list | Allow | Allow | Deny | Allow |
| Incident read-model detail | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none
- Backward compatibility:
  - additive API behavior only

## API and Event Changes

- Endpoints added:
  - `GET /scheduling/anomalies/incidents`
  - `GET /scheduling/anomalies/incidents/{incidentId}`
- Domain events:
  - none new (reuses WI-0072 lifecycle event source)
- Audit events:
  - `scheduling.anomaly.incident.listed`
  - `scheduling.anomaly.incident.read`

## Test Plan

- Unit:
  - incident list query validation (`state`, `assigneeId`, `topN`)
  - tenant scope filter logic for read-model projection
- Integration:
  - manager list returns total/items
  - `state` filter returns only matching incidents
  - detail endpoint returns timeline history
  - employee denied (403) for list/detail
  - cross-tenant detail returns 404
- Regression:
  - incident command endpoints remain unchanged
  - read-model path does not mutate scheduling/attendance state
- Authorization:
  - scheduling write-any permission required
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.incident.listed`
  - `scheduling.anomaly.incident.read`
- Metrics:
  - `schedule_anomaly_incident_lifecycle_command_count` (existing optional metric)
- Alert conditions:
  - repeated list/detail error responses in operator flow

## Rollback Plan

- API rollback:
  - revert read-model route/service changes
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
