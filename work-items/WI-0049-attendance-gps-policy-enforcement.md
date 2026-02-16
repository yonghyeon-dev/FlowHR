# WI-0049: Attendance GPS Policy Enforcement Baseline

## Background and Problem

WI-0048 added capture channel metadata, but runtime policy is still permissive. Employee self-recording can still use manual or non-GPS channels even when an organization wants stricter capture trust.

Phase 2 requires a minimal enforcement baseline so GPS-required operations can be enabled without introducing full geofence/device attestation complexity.

## Scope

### In Scope

- Add feature-flag based enforcement for employee attendance create/update:
  - `FLOWHR_ATTENDANCE_GPS_REQUIRED=true`
- When enabled, employee write paths must keep effective capture state as:
  - channel = `GPS`
  - latitude/longitude present
- Keep manager/admin correction path behavior unchanged for operational recovery.
- Add regression coverage for policy on/off scenarios.

### Out of Scope

- Geofence radius validation
- Device attestation/spoofing prevention
- Wi-Fi/BLE trusted network policy engine

## User Scenarios

1. Employee create without GPS capture is blocked when policy is enabled.
2. Employee create with GPS coordinates is accepted.
3. Employee cannot downgrade pending record capture from GPS to QR/manual while policy is enabled.
4. Manager can still create manual correction records for operational exception handling.

## Payroll Accuracy and Calculation Rules

- GPS policy only governs attendance write acceptance.
- Approved-minute aggregation and payroll calculation remain unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Employee GPS policy enforcement | Bypass | Bypass | Enforced | Bypass |
| Attendance approval/rejection | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - `AttendanceRecord`
- Migration IDs:
  - none (runtime validation and feature flag only)
- Backward compatibility:
  - default flag off, no behavior change until enabled

## API and Event Changes

- Endpoint behavior update:
  - `POST /attendance/records` enforces GPS capture for employee actor when flag enabled
  - `PATCH /attendance/records/{recordId}` enforces effective GPS capture for employee actor when flag enabled
- Events published:
  - none (existing attendance events unchanged)
- Events consumed:
  - none

## Test Plan

- Unit:
  - feature flag truthy parsing behavior
  - effective capture state validation for update path
- Integration:
  - employee manual create blocked when policy enabled
  - employee GPS create allowed when policy enabled
  - employee downgrade update blocked when policy enabled
  - manager manual create still allowed
- Regression:
  - WI-0048 capture metadata behavior unchanged when policy disabled
- Authorization:
  - own/any permission model unchanged
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing `attendance.recorded`, `attendance.corrected` remain
- Metrics:
  - `attendance_gps_policy_reject_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_ATTENDANCE_GPS_REQUIRED=false`
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
