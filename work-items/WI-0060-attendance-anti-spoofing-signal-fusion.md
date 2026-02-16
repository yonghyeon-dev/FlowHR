# WI-0060: Attendance Anti-Spoofing Signal Fusion and Reputation Baseline

## Background and Problem

Anti-spoofing baseline (WI-0056) applies simple risk scoring, but high-risk device/IP reputation signals are not fused into write decisions.

Phase 2 requires a stronger employee write guard that combines capture signals and external reputation lists while remaining feature-flagged and non-breaking.

## Scope

### In Scope

- Extend anti-spoofing policy runtime for employee attendance create/update:
  - signal fusion minimum-signal rule
  - static external reputation penalties (high-risk device IDs / IPs)
- Add feature flag and config inputs:
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS`
- Keep existing anti-spoofing threshold contract (`riskScore <= threshold`) and manager bypass behavior.
- No schema migration.

### Out of Scope

- Dynamic/real-time external reputation provider integration
- Device graph/risk intelligence platform integration
- Automatic account lockout workflow

## User Scenarios

1. Employee write with risky device/IP reputation is rejected when fusion flag is enabled.
2. Employee write with insufficient trusted signal count is rejected when fusion flag is enabled.
3. Employee write with safe fused capture payload is accepted.
4. Manager correction path remains allowed.

## Payroll Accuracy and Calculation Rules

- Policy impacts attendance write acceptance only.
- Payroll minute calculation logic is unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Anti-spoofing fusion/reputation enforcement | Bypass | Bypass | Enforced | Bypass |
| Attendance write | Allow | Allow | Own-only | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime policy/config only)
- Backward compatibility:
  - additive flag/config behavior only

## API and Event Changes

- Endpoint behavior updates:
  - `POST /attendance/records` applies fusion/reputation penalties in anti-spoofing score for employee actor when flag enabled
  - `PATCH /attendance/records/{recordId}` applies fusion/reputation penalties on effective capture for employee actor when flag enabled
- Events published:
  - none (existing attendance events unchanged)
- Events consumed:
  - none

## Test Plan

- Unit:
  - signal-fusion minimum-signal rule boundaries
  - reputation penalty boundaries and config parsing validation
- Integration:
  - risky device/ip employee write rejected when fusion flag enabled
  - insufficient-signal employee write rejected when fusion flag enabled
  - safe fused payload accepted
  - manager bypass path remains allowed
- Regression:
  - WI-0056 anti-spoofing baseline behavior remains valid when fusion flag disabled
- Authorization:
  - employee-only enforcement
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing attendance audit events unchanged
- Metrics:
  - `attendance_anti_spoofing_signal_fusion_reject_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - disable `FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED`
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
