# WI-0054: Attendance Device Attestation Policy Baseline

## Background and Problem

Attendance policy now supports GPS/geofence and trusted-device allowlist enforcement, but there is no attestation signal to validate that the reported device context is authenticated per request.

Phase 2 needs a baseline attestation policy that can be enforced without DB schema expansion while remaining feature-flagged and backward-compatible.

## Scope

### In Scope

- Add feature-flag based device attestation enforcement for employee attendance create/update:
  - `FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED=true`
- Read attestation mapping config from environment:
  - `FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_TOKENS` (format: `DEVICE_ID:ATTESTATION_TOKEN,...`)
- When enabled, employee write paths must satisfy:
  - effective `capture.deviceId` is present
  - request `capture.attestationToken` is present
  - token equals configured mapping for effective deviceId
- Keep manager/admin correction path behavior unchanged.
- Add e2e regression coverage for missing/mismatched/matched token paths.

### Out of Scope

- Cryptographic attestation protocol and key lifecycle
- Hardware-backed anti-spoofing integration
- Device enrollment admin UI

## User Scenarios

1. Employee create without `capture.attestationToken` is rejected when policy is enabled.
2. Employee create with mismatched token for deviceId is rejected.
3. Employee create with configured device/token pair is accepted.
4. Employee update with mismatched token is rejected.
5. Manager correction path remains available for operational exception handling.

## Payroll Accuracy and Calculation Rules

- Device attestation policy affects attendance write acceptance only.
- Payroll calculation and approval aggregation logic remain unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Device attestation enforcement on attendance write | Bypass | Bypass | Enforced | Bypass |
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
  - `POST /attendance/records` validates `capture.attestationToken` + effective `deviceId` mapping for employee actor when flag enabled
  - `PATCH /attendance/records/{recordId}` validates effective `deviceId` and request token for employee actor when flag enabled
- Request payload update:
  - attendance capture payload accepts optional `attestationToken`
- Events published:
  - none (existing attendance events unchanged)
- Events consumed:
  - none

## Test Plan

- Unit:
  - device attestation mapping parsing and invalid format guard
  - effective deviceId + token validation in update path
- Integration:
  - employee write missing token is rejected when attestation flag is enabled
  - employee write mismatched token is rejected when attestation flag is enabled
  - employee write mapped token is accepted when attestation flag is enabled
  - manager correction path remains allowed
- Regression:
  - trusted-device and geofence behavior remains unchanged when attestation flag is disabled
- Authorization:
  - own/any permission model unchanged
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing `attendance.recorded`, `attendance.corrected` remain
- Metrics:
  - `attendance_device_attestation_reject_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED=false`
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
