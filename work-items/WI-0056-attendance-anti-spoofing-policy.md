# WI-0056: Attendance Anti-Spoofing Policy Baseline

## Background and Problem

Attendance policy now supports trusted device, multi-site geofence, and device attestation controls. However, there is no unified risk-score gate to block suspicious capture payloads when signals are weak or inconsistent.

Phase 2 needs a lightweight anti-spoofing baseline that stays feature-flagged and non-breaking while providing policy-level rejection for high-risk employee writes.

## Scope

### In Scope

- Add feature-flag based anti-spoofing risk scoring:
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED=true`
- Add policy config via environment:
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD`
- Compute risk score on employee attendance create/update using effective capture payload:
  - channel allowlist mismatch
  - missing deviceId
  - missing ipAddress
  - GPS accuracy missing/exceeding threshold
- Reject employee write when risk score exceeds configured threshold.
- Keep manager/admin correction path behavior unchanged.
- Add e2e regression coverage for reject/accept/bypass paths.

### Out of Scope

- ML-based anomaly detection and signal fusion
- Hardware attestation verification chain
- Reputation scoring with external device/IP intelligence

## User Scenarios

1. Employee write with high-risk capture payload is rejected when anti-spoofing policy is enabled.
2. Employee write with low-risk capture payload is accepted.
3. Employee update that raises effective risk above threshold is rejected.
4. Manager correction path remains available for operational exception handling.

## Payroll Accuracy and Calculation Rules

- Anti-spoofing policy affects attendance write acceptance only.
- Payroll approval/aggregation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Anti-spoofing enforcement on attendance write | Bypass | Bypass | Enforced | Bypass |
| Attendance approval/rejection | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime policy and feature flag only)
- Backward compatibility:
  - default flag off, no behavior change until enabled

## API and Event Changes

- Endpoint behavior update:
  - `POST /attendance/records` applies anti-spoofing risk score for employee actor when flag enabled
  - `PATCH /attendance/records/{recordId}` applies anti-spoofing risk score on effective capture for employee actor when flag enabled
- Events published:
  - none (existing attendance events unchanged)
- Events consumed:
  - none

## Test Plan

- Unit:
  - risk score calculation boundaries
  - allowed channel parsing and threshold validation
- Integration:
  - employee high-risk write is rejected when anti-spoofing flag is enabled
  - employee low-risk write is accepted when anti-spoofing flag is enabled
  - manager correction path remains allowed
- Regression:
  - trusted-device/attestation/geofence behavior remains unchanged when anti-spoofing flag is disabled
- Authorization:
  - own/any permission model unchanged
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing `attendance.recorded`, `attendance.corrected` remain
- Metrics:
  - `attendance_anti_spoofing_reject_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED=false`
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
