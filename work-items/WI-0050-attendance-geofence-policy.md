# WI-0050: Attendance Geofence Policy Enforcement Baseline

## Background and Problem

WI-0048 and WI-0049 introduced capture metadata and employee GPS-required policy. However, employee GPS check-ins are still accepted regardless of physical location.

Phase 2 requires a geofence baseline so employee GPS attendance can be constrained to a configurable site boundary without introducing full anti-spoofing/device attestation.

## Scope

### In Scope

- Add feature-flag based geofence enforcement for employee attendance create/update:
  - `FLOWHR_ATTENDANCE_GEOFENCE_ENABLED=true`
- Read geofence config from environment:
  - `FLOWHR_ATTENDANCE_GEOFENCE_LAT`
  - `FLOWHR_ATTENDANCE_GEOFENCE_LNG`
  - `FLOWHR_ATTENDANCE_GEOFENCE_RADIUS_METERS`
- When enabled, employee write paths must keep effective capture state as GPS with coordinates inside configured radius.
- Keep manager/admin correction path behavior unchanged.
- Add e2e regression coverage for inside/outside geofence behavior.

### Out of Scope

- Polygon/multi-site geofence policies
- Device attestation or anti-spoofing signals
- Wi-Fi/BLE trusted network policy

## User Scenarios

1. Employee GPS check-in outside configured geofence is rejected.
2. Employee GPS check-in inside configured geofence is accepted.
3. Employee update that moves location outside geofence is rejected.
4. Manager correction write path remains available for operational exceptions.

## Payroll Accuracy and Calculation Rules

- Geofence policy affects attendance write acceptance only.
- Payroll calculation and approved-minute aggregation logic remain unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Geofence enforcement on attendance write | Bypass | Bypass | Enforced | Bypass |
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
  - `POST /attendance/records` enforces geofence for employee actor when flag enabled
  - `PATCH /attendance/records/{recordId}` enforces geofence for effective employee capture state when flag enabled
- Events published:
  - none (existing attendance events unchanged)
- Events consumed:
  - none

## Test Plan

- Unit:
  - geofence config parsing and bounds validation
  - haversine distance threshold boundary
- Integration:
  - employee GPS create outside geofence is rejected
  - employee GPS create inside geofence is accepted
  - employee update to outside geofence is rejected
  - manager correction path remains allowed
- Regression:
  - WI-0049 GPS policy behavior remains consistent
- Authorization:
  - own/any permission model unchanged
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing `attendance.recorded`, `attendance.corrected` remain
- Metrics:
  - `attendance_geofence_reject_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_ATTENDANCE_GEOFENCE_ENABLED=false`
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
