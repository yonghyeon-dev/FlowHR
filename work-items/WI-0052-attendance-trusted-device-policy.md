# WI-0052: Attendance Trusted Device Policy Baseline

## Background and Problem

Attendance policy currently supports GPS and geofence constraints (WI-0049, WI-0050), but employee check-ins are not validated against an approved device list.

Phase 2 requires a trusted device baseline so employee attendance writes can be constrained to configured device identifiers.

## Scope

### In Scope

- Add feature-flag based trusted device enforcement for employee attendance create/update:
  - `FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED=true`
- Read allowlist config from environment:
  - `FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS` (comma-separated)
- When enabled, employee write paths must keep effective `capture.deviceId` in trusted allowlist.
- Keep manager/admin correction path behavior unchanged.
- Add e2e regression coverage for trusted/untrusted device paths.

### Out of Scope

- Cryptographic device attestation
- Device lifecycle admin UI and enrollment workflow
- Hardware-bound anti-spoofing policy

## User Scenarios

1. Employee write without `capture.deviceId` is rejected when policy is enabled.
2. Employee write with untrusted deviceId is rejected.
3. Employee write with trusted deviceId is accepted.
4. Manager correction path remains available for operational exception handling.

## Payroll Accuracy and Calculation Rules

- Trusted device policy affects attendance write acceptance only.
- Payroll calculation/approval aggregation behavior remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Trusted device enforcement on attendance write | Bypass | Bypass | Enforced | Bypass |
| Attendance approval/rejection | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - `AttendanceRecord`
- Migration IDs:
  - none (runtime policy and feature flag only)
- Backward compatibility:
  - default flag off, no behavior change until enabled

## API and Event Changes

- Endpoint behavior update:
  - `POST /attendance/records` enforces trusted device allowlist for employee actor when flag enabled
  - `PATCH /attendance/records/{recordId}` enforces effective trusted device state for employee actor when flag enabled
- Events published:
  - none (existing attendance events unchanged)
- Events consumed:
  - none

## Test Plan

- Unit:
  - trusted device allowlist parsing
  - effective deviceId validation for update path
- Integration:
  - employee missing deviceId is rejected when policy enabled
  - employee untrusted deviceId is rejected when policy enabled
  - employee trusted deviceId is accepted when policy enabled
  - manager correction path remains allowed
- Regression:
  - WI-0050 geofence behavior remains unchanged
- Authorization:
  - own/any permission model unchanged
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing `attendance.recorded`, `attendance.corrected` remain
- Metrics:
  - `attendance_trusted_device_reject_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED=false`
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
