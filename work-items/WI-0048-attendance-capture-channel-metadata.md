# WI-0048: Attendance Capture Channel Metadata Baseline

## Background and Problem

FlowHR attendance recording currently assumes manual input and does not preserve capture context (GPS/QR/Wi-Fi/device).

Phase 2 requires capture channel metadata so downstream anomaly detection, policy enforcement, and audit trace can distinguish trusted capture paths from manual edits.

## Scope

### In Scope

- Extend attendance create/update payload to support capture metadata.
- Persist capture metadata on `AttendanceRecord`:
  - channel (`MANUAL`, `GPS`, `QR`, `WIFI`, `DEVICE`)
  - device identifier
  - IP address
  - location (latitude/longitude, optional accuracy)
- Validate GPS-specific payload rules:
  - GPS channel requires latitude and longitude.
  - location coordinates must be provided as a complete pair.
- Keep attendance approval/rejection/payroll aggregation behavior unchanged.
- Keep audit/event payloads traceable with capture metadata.

### Out of Scope

- Real geofence enforcement and distance policy.
- Physical device attestation and anti-spoofing.
- BLE beacon / kiosk protocol integration.

## User Scenarios

1. Employee records attendance through mobile GPS with coordinates.
2. Employee records attendance through QR channel without location.
3. Invalid GPS payload (missing coordinates) is rejected with `400`.
4. Manager corrects pending attendance and updates capture metadata for audit consistency.

## Payroll Accuracy and Calculation Rules

- Capture channel metadata does not change payable minute calculation.
- Payroll preview/confirm consumes only approved attendance time values.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Record attendance with capture metadata | Allow | Allow | Allow (own only) | Allow |
| Update pending attendance capture metadata | Allow | Allow | Allow (own only) | Allow |
| Approve/reject attendance | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables changed:
  - `AttendanceRecord`
  - `AuditLog`
- Migration IDs:
  - `202602160002_wi0048_attendance_capture_metadata`
- Backward compatibility:
  - additive columns with default channel (MANUAL) and nullable metadata fields

## API and Event Changes

- Endpoint updates:
  - `POST /attendance/records` payload extends with optional `capture` object
  - `PATCH /attendance/records/{recordId}` payload extends with optional `capture` object
- Events published:
  - `attendance.recorded.v1` (payload enriched with capture metadata)
  - `attendance.corrected.v1` (payload enriched when capture metadata is updated)
- Events consumed:
  - none

## Test Plan

- Unit:
  - capture schema validation (GPS requires coordinates)
  - coordinate pair validation (latitude/longitude must be provided together)
- Integration:
  - create attendance with GPS metadata succeeds
  - update pending attendance capture metadata succeeds
  - invalid GPS payload is rejected with `400`
- Regression:
  - WI-0001 attendance to payroll flow remains unchanged
  - attendance aggregates remain approval-state based
- Authorization:
  - own vs any permission boundaries unchanged
- Payroll accuracy:
  - capture metadata changes do not alter gross pay output

## Observability and Audit Logging

- Audit events:
  - `attendance.recorded`
  - `attendance.corrected`
- Metrics:
  - `attendance_capture_channel_count` (by channel, optional)
  - `attendance_capture_gps_missing_rejection_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior:
  - continue using existing `attendance_v1`; new fields are optional
- DB rollback:
  - keep additive columns, ignore at runtime if rollback needed
- Recovery target:
  - < 30m

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
