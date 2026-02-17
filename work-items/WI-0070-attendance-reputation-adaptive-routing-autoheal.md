# WI-0070: Attendance Reputation Adaptive Routing and Auto-Heal Baseline

## Background and Problem

WI-0066 introduced provider circuit-breaker, but provider query order is still static and open providers only recover after fixed cooldown.
Operations need faster stabilization: prioritize healthy providers first and re-probe open providers periodically so recovered providers can return early.

## Scope

### In Scope

- Extend external reputation runtime with optional adaptive routing:
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ADAPTIVE_ROUTING_ENABLED`
  - deterministic provider ordering by circuit/failure/success state
- Extend runtime with optional open-circuit auto-heal probing:
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AUTO_HEAL_ENABLED`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AUTO_HEAL_PROBE_INTERVAL_SECONDS`
  - open providers are probed after interval; successful probe closes circuit immediately
- Preserve strict/min-success/circuit-breaker compatibility and manager bypass behavior.

### Out of Scope

- Cross-instance shared provider health state
- Provider ML trust scoring
- Alert/notification fanout workflow for provider heal events

## User Scenarios

1. Failed provider opens circuit; next writes prioritize healthy provider first.
2. Open provider is probed after interval and recovered provider is reused before cooldown expiry.
3. With new flags disabled, WI-0066 behavior remains unchanged.

## Payroll Accuracy and Calculation Rules

- Reputation routing changes attendance write latency/acceptance only.
- Payroll calculation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Reputation adaptive routing/auto-heal policy | Bypass | Bypass | Enforced | Bypass |
| Attendance write | Allow | Allow | Own-only | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none
- Backward compatibility:
  - additive env/config behavior only

## API and Event Changes

- Endpoint behavior updates:
  - `POST /attendance/records`
  - `PATCH /attendance/records/{recordId}`
  - (runtime behavior update only; response schema unchanged)
- Events published:
  - none new
- Events consumed:
  - none

## Test Plan

- Unit:
  - adaptive routing ordering and tie-break determinism
  - auto-heal probe interval validation and circuit dependency validation
- Integration:
  - healthy provider prioritization after one provider opens circuit
  - open provider probe after interval and immediate circuit close on success
  - healed provider reused on subsequent request before cooldown expiry
- Regression:
  - WI-0066 circuit-breaker skip behavior remains when adaptive/auto-heal flags are disabled
- Authorization:
  - employee-only enforcement
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing attendance audit events unchanged
- Metrics:
  - `attendance_anti_spoofing_external_reputation_adaptive_route_count` (optional)
  - `attendance_anti_spoofing_external_reputation_auto_heal_probe_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - disable `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ADAPTIVE_ROUTING_ENABLED`
  - disable `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AUTO_HEAL_ENABLED`
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
