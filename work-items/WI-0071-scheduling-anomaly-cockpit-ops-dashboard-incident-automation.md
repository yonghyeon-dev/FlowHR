# WI-0071: Scheduling Anomaly Cockpit Ops Dashboard and Stream Incident Automation

## Background and Problem

WI-0068 introduced bounded SSE snapshots for anomaly cockpit streaming.
Operators still need two capabilities for practical operations:

1. a dedicated operator-facing UI for live monitoring and stream controls
2. an in-stream incident automation signal that can be rate-limited to avoid repetitive downstream actions

Without these, triage remains manual and repetitive under sustained anomaly conditions.

## Scope

### In Scope

- Extend stream query contract for optional incident automation controls:
  - `incidentAutomation` (boolean-like)
  - `incidentSeverity` (`MINOR|MAJOR|CRITICAL`)
  - `incidentCooldownSeconds` (`0..3600`)
- Emit additional SSE event when policy matches:
  - `incident-automation`
- Keep existing `cockpit-snapshot` and `stream-end` events unchanged.
- Add operator dashboard UI page:
  - route: `/ops/scheduling-cockpit`
  - stream start/stop, reconnect, and incident feed visualization
  - supports Dev Header mode and Bearer token mode
- Preserve read-only behavior and ticket automation suppression in stream path.

### Out of Scope

- Persistent incident state store
- External ticket provider integration (Jira/ServiceNow)
- WebSocket replacement for SSE
- Cross-tenant/global operator wallboard aggregation

## User Scenarios

1. Manager opens `/ops/scheduling-cockpit`, starts stream, and watches live snapshots with queue priorities.
2. When incident automation is enabled and severity threshold is matched, stream emits `incident-automation` once per cooldown window.
3. When incident automation is disabled, stream remains snapshot-only with no behavioral regression.

## Payroll Accuracy and Calculation Rules

- This WI is operational monitoring/automation signal only.
- Payroll aggregation and payroll settlement outputs are unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Cockpit stream read | Allow | Allow | Deny | Allow |
| Incident automation SSE signal | Allow | Allow | Deny | Allow |
| Schedule/attendance/payroll mutation from stream path | Deny | Deny | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none
- Backward compatibility:
  - additive query fields and SSE event only

## API and Event Changes

- Endpoint behavior updated:
  - `GET /scheduling/anomalies/cockpit/stream`
- Added optional query fields:
  - `incidentAutomation`
  - `incidentSeverity`
  - `incidentCooldownSeconds`
- SSE events:
  - existing: `cockpit-snapshot`, `stream-end`, `stream-error`
  - new: `incident-automation`
- Domain events:
  - none (stream incident automation remains non-domain SSE signal)
- Audit events:
  - existing `scheduling.anomaly.cockpit.stream.opened` payload extended with incident policy fields

## Test Plan

- Unit:
  - severity threshold matching logic for incident automation payload
  - cooldown suppression logic for repeated snapshot windows
- Integration:
  - stream emits `incident-automation` when enabled and threshold matched
  - stream emits at most one `incident-automation` within cooldown window
  - stream emits no `incident-automation` when disabled
  - stream-opened audit includes incident policy fields
- Regression:
  - WI-0068 snapshot streaming contract remains unchanged
  - stream path remains read-only and continues ticket-automation suppression
- Authorization:
  - employee denied for cockpit stream
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.anomaly.cockpit.stream.opened` (extended payload)
- Metrics:
  - `schedule_anomaly_cockpit_stream_query_count` (optional)
  - `schedule_anomaly_cockpit_stream_incident_automation_count` (optional)
- Alert conditions:
  - repeated stream failures or unexpected incident signal spikes

## Rollback Plan

- Feature toggle:
  - set `incidentAutomation=false` on stream callers
- Code rollback:
  - revert WI-0071 route/UI changes and redeploy
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
