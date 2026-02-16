# WI-0053: Attendance Multi-Site Geofence Policy Baseline

## Background and Problem

Attendance geofence policy (WI-0050) currently supports a single center point and radius.
Multi-branch operations require validating employee GPS captures against multiple approved sites.

Phase 2 needs a contract-first baseline to support site-based attendance enforcement without introducing DB schema changes.

## Scope

### In Scope

- Add feature-flag based multi-site geofence enforcement for employee attendance create/update:
  - `FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED=true`
- Read multi-site geofence config from environment:
  - `FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_SITES` (format: `SITE_ID:LAT:LNG:RADIUS;...`)
- When enabled, employee write paths must keep effective GPS coordinates inside at least one configured site geofence.
- Keep manager/admin correction path behavior unchanged.
- Add e2e regression coverage for outside/inside/update/bypass paths.

### Out of Scope

- Polygon geofence engine and map authoring UI
- Site-specific policy assignment by employee/department
- Device attestation and anti-spoofing signals

## User Scenarios

1. Employee create with GPS coordinates outside all configured sites is rejected.
2. Employee create with GPS coordinates inside one configured site is accepted.
3. Employee update that moves coordinates outside all configured sites is rejected.
4. Manager correction path remains available for operational exception handling.

## Payroll Accuracy and Calculation Rules

- Multi-site geofence policy only affects attendance write acceptance.
- Approval/payroll aggregation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Multi-site geofence enforcement on attendance write | Bypass | Bypass | Enforced | Bypass |
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
  - `POST /attendance/records` enforces multi-site geofence for employee actor when flag enabled
  - `PATCH /attendance/records/{recordId}` enforces effective multi-site geofence for employee actor when flag enabled
- Events published:
  - none (existing attendance events unchanged)
- Events consumed:
  - none

## Test Plan

- Unit:
  - multi-site geofence site list parsing and numeric boundary validation
  - effective update-path coordinate validation against configured sites
- Integration:
  - employee create outside all configured site geofences is rejected
  - employee create inside one configured site geofence is accepted
  - employee update outside all configured site geofences is rejected
  - manager correction path remains allowed
- Regression:
  - WI-0050 single geofence behavior remains unchanged when multi-site flag is disabled
- Authorization:
  - own/any permission model unchanged
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing `attendance.recorded`, `attendance.corrected` remain
- Metrics:
  - `attendance_multisite_geofence_reject_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED=false`
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
