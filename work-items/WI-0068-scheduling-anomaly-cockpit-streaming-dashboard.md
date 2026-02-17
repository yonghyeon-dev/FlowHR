# WI-0068: Scheduling Anomaly Cockpit Streaming Dashboard Baseline

## Background and Problem

WI-0065 provides tenant-level anomaly cockpit snapshots and WI-0067 adds ticket-request automation.
Operators still need near real-time visibility without repeatedly polling cockpit endpoints manually.

Phase 2 requires a streaming baseline that can feed a dashboard with bounded, repeatable snapshots.

## Scope

### In Scope

- Add stream endpoint:
  - `GET /scheduling/anomalies/cockpit/stream`
- Stream query fields:
  - `from`, `to`, `lateThresholdMinutes` (optional), `topN` (optional)
  - `intervalSeconds` (optional, `0..60`)
  - `sampleCount` (optional, `1..30`)
- Stream response:
  - SSE `cockpit-snapshot` events containing cockpit report payload
  - SSE `stream-end` event after requested sample count
- Add stream audit event:
  - `scheduling.anomaly.cockpit.stream.opened`
- Keep stream path read-only and preserve existing cockpit authorization boundary.
- Stream execution suppresses ticket automation side-effects to avoid duplicate ticket requests per snapshot.

### Out of Scope

- Persistent WebSocket session manager
- Browser dashboard UI implementation
- Cross-tenant global stream aggregation
- Ticket dedup/cooldown persistence

## User Scenarios

1. Manager opens stream endpoint and receives multiple cockpit snapshots as SSE events.
2. Manager can tune sample cadence via `intervalSeconds` and total snapshots via `sampleCount`.
3. Employee role cannot access stream endpoint.

## Payroll Accuracy and Calculation Rules

- Stream endpoint is read-only monitoring path.
- Payroll calculation and settlement outputs remain unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Cockpit stream read | Allow | Allow | Deny | Allow |
| Cockpit ticket automation from stream | Suppress | Suppress | N/A | Suppress |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime/API/audit behavior only)
- Backward compatibility:
  - additive endpoint only

## API and Event Changes

- Endpoint added:
  - `GET /scheduling/anomalies/cockpit/stream`
- Domain events:
  - none (stream path does not emit additional domain events)
- Audit events:
  - `scheduling.anomaly.cockpit.stream.opened`

## Test Plan

- Unit:
  - stream query validation boundaries (`intervalSeconds`, `sampleCount`)
- Integration:
  - manager stream request returns SSE snapshots and stream-end event
  - stream path appends `scheduling.anomaly.cockpit.stream.opened` audit log
  - stream suppresses ticket automation event even when ticket automation flag is enabled
  - employee stream request denied (403)
- Regression:
  - stream snapshots reuse cockpit report invariants and remain read-only
  - existing cockpit endpoint behavior unchanged
- Authorization:
  - scheduling write-any boundary required for cockpit stream
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.cockpit.stream.opened`
- Metrics:
  - `schedule_anomaly_cockpit_stream_query_count` (optional)
- Alert conditions:
  - stream generation failure or repeated stream-error events

## Rollback Plan

- Feature toggle:
  - no dedicated toggle (additive endpoint; hide route via deployment rollback if needed)
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
