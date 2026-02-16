# Attendance Test Cases

## Scope

Attendance create/update/approval behavior and output consistency for payroll aggregation.

## Functional Cases

1. Create attendance record within same business day.
2. Reject attendance create/update when `employeeId` does not exist (404).
3. Update attendance before approval.
4. Approve correction by manager role.
5. Reject attendance by manager role with optional reason and verify exclusion from payroll aggregation.
6. Reject unauthorized approval/rejection attempt.
7. Emit final-state event once (`approved` or `rejected`).
8. Rejection reason is preserved in audit/event payload when provided.
9. Reject API returns `400` for invalid JSON body and oversized reason payload.
10. List attendance records by period (`from`/`to`) with role boundary guards (employee self-only, manager requires employeeId).
11. List attendance aggregates by period (`from`/`to`) with role boundary guards and verify totals are derived from approved records only.
12. Create attendance with capture metadata (GPS/QR/WIFI/device) and verify fields are persisted in response.
13. Update pending attendance capture metadata and verify audit/event trace includes capture fields.
14. Reject attendance create/update when capture payload is invalid (GPS without coordinates, partial coordinate pair).
15. When `FLOWHR_ATTENDANCE_GPS_REQUIRED=true`, employee non-GPS create/update is rejected while manager correction path remains allowed.
16. When `FLOWHR_ATTENDANCE_GEOFENCE_ENABLED=true`, employee GPS create/update outside configured radius is rejected while manager correction path remains allowed.
17. When `FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED=true`, employee write with missing/untrusted deviceId is rejected while trusted deviceId is accepted.

## Boundary and Accuracy Cases

1. Overnight shift crossing midnight is mapped using 04:00 workday boundary.
2. Minute rounding behavior matches common SSoT rules.
3. Correction after initial approval creates auditable recalculation signal.
4. Reject reason length `> 500` is blocked and does not create audit/event side effects.
5. GPS capture channel without both latitude/longitude is blocked.
6. Latitude/longitude must be provided as a complete pair or omitted together.
7. GPS policy feature flag only applies to employee write path and is ignored when disabled.
8. Geofence policy feature flag only applies to employee write path and validates configured radius boundary.
9. Trusted device policy feature flag only applies to employee write path and validates configured allowlist.

## Regression Linkage

- `GC-001-standard-day.json`
- `GC-002-overnight-boundary.json`
- `GC-003-late-correction.json`
- `GC-005-retroactive-recalc.json`

## QA Gate Expectations

- Spec Gate: contract completeness and role matrix validated.
- Code Gate: unit/integration tests and fixture regression pass.
