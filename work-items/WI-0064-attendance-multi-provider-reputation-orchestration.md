# WI-0064: Attendance Multi-Provider Reputation Orchestration Baseline

## Background and Problem

WI-0062 introduced dynamic external reputation integration for anti-spoofing, but provider mode is effectively single-remote.
For production operations, one provider outage or data skew can either over-block attendance writes or weaken risk detection.

Phase 2 needs multi-provider orchestration that supports deterministic aggregation and minimum-success guardrails.

## Scope

### In Scope

- Extend external reputation runtime config for multi-provider orchestration:
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URLS`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AGGREGATION` (`union` | `majority`)
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MAJORITY_THRESHOLD`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS`
- Keep existing single URL compatibility (`..._EXTERNAL_REPUTATION_URL`) as fallback.
- Load remote snapshots from multiple providers and aggregate risk sets:
  - `union`: any provider hit marks risk
  - `majority`: provider hit count must meet threshold
- Enforce minimum provider success count:
  - strict mode: fail closed when `min_success` is not met
  - non-strict mode: fallback to static lists
- Preserve manager/admin correction bypass behavior.

### Out of Scope

- Provider authentication, credential rotation, and key-management automation
- Circuit-breaker dashboard, retry queue orchestration, and adaptive routing
- Weighted provider trust scoring and ML-based reputation confidence

## User Scenarios

1. Employee write is accepted in majority mode when risk signal appears in fewer providers than threshold.
2. Employee write is rejected when risk signal reaches configured majority threshold.
3. Strict mode rejects employee writes when minimum provider success count is not met.
4. Manager correction path remains allowed regardless of provider failures or risk hits.

## Payroll Accuracy and Calculation Rules

- Policy impacts attendance write acceptance only.
- Payroll calculation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Multi-provider reputation enforcement on attendance write | Bypass | Bypass | Enforced | Bypass |
| Attendance write | Allow | Allow | Own-only | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime policy behavior only)
- Backward compatibility:
  - additive env/config + runtime behavior only

## API and Event Changes

- Endpoint behavior updates:
  - `POST /attendance/records` supports multi-provider reputation aggregation/threshold semantics when enabled
  - `PATCH /attendance/records/{recordId}` supports multi-provider reputation aggregation/threshold semantics when enabled
- Events published:
  - none new
- Events consumed:
  - none

## Test Plan

- Unit:
  - multi-provider URL/aggregation/threshold/min-success config validation
  - provider snapshot merge behavior (`union` vs `majority`)
- Integration:
  - majority-safe acceptance case
  - majority-threshold rejection case
  - strict-mode minimum-success failure case
  - manager bypass path remains allowed
- Regression:
  - WI-0062 single-provider path remains backward compatible
- Authorization:
  - employee-only enforcement
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing attendance audit events unchanged
- Metrics:
  - `attendance_anti_spoofing_external_reputation_provider_success_count` (optional)
  - `attendance_anti_spoofing_external_reputation_provider_failure_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - disable `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED`
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
