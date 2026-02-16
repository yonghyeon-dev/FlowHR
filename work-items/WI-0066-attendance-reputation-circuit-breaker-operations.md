# WI-0066: Attendance Reputation Circuit-Breaker Operations Baseline

## Background and Problem

WI-0064 added multi-provider reputation orchestration, but repeated provider failures can continuously consume timeout budget and destabilize attendance write latency.
A minimal runtime safeguard is needed to fail fast on unhealthy providers and reduce repeated retry cost.

## Scope

### In Scope

- Add provider-level circuit-breaker controls for external reputation orchestration:
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CIRCUIT_BREAKER_ENABLED`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_FAILURE_THRESHOLD`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_COOLDOWN_SECONDS`
- Track provider failure streak and open-circuit cooldown in runtime memory.
- Behavior:
  - when provider failure streak reaches threshold, provider is skipped until cooldown expires
  - minimum-success rule still applies to non-skipped successful providers
  - strict mode keeps fail-closed behavior when minimum-success is not satisfied
- Preserve single/multi-provider compatibility and manager bypass behavior.

### Out of Scope

- Distributed circuit-breaker state sharing across instances
- Adaptive threshold tuning / health-score ML
- Provider auto-heal notification workflow

## User Scenarios

1. A provider repeatedly failing is skipped during cooldown instead of retried every request.
2. In strict mode, attendance write is rejected when minimum-success cannot be met due open/failed providers.
3. Disabling circuit-breaker restores direct provider retry behavior.

## Payroll Accuracy and Calculation Rules

- Circuit-breaker affects attendance write acceptance/latency only.
- Payroll calculation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Reputation circuit-breaker policy on attendance write | Bypass | Bypass | Enforced | Bypass |
| Attendance write | Allow | Allow | Own-only | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime policy behavior only)
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
  - circuit-breaker config validation boundaries
  - provider state transition (closed -> open -> cooldown)
- Integration:
  - strict mode + min-success failure when provider is open/failed
  - provider skip during cooldown reduces repeated provider calls
  - disabling circuit-breaker restores provider retry path
- Regression:
  - WI-0064 multi-provider aggregation behavior remains valid when breaker is off
- Authorization:
  - employee-only enforcement
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing attendance audit events unchanged
- Metrics:
  - `attendance_anti_spoofing_external_reputation_circuit_open_count` (optional)
  - `attendance_anti_spoofing_external_reputation_circuit_skip_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - disable `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CIRCUIT_BREAKER_ENABLED`
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
