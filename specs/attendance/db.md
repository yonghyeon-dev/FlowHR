# Attendance DB Notes

## Tables

- `AttendanceRecord`
  - `employeeId` -> `Employee.id` (FK enforced; WI-0035)
  - `captureChannel` enum (`MANUAL`, `GPS`, `QR`, `WIFI`, `DEVICE`) with default `MANUAL`
  - `captureDeviceId`, `captureIpAddress`, `captureLatitude`, `captureLongitude`, `captureAccuracyMeters` (optional capture metadata)
- `AuditLog` (shared; created in WI-0001 migration extensions)

## Migrations

- `202602130001_init_wi0001`
- `202602130002_wi0001_api_extensions`
- `202602140006_employee_fk_constraints`
- `202602160002_wi0048_attendance_capture_metadata`

No additional migration in WI-0060 (anti-spoofing signal-fusion/reputation is runtime policy behavior only).
No additional migration in WI-0062 (dynamic external reputation integration is runtime policy behavior only).
No additional migration in WI-0064 (multi-provider reputation orchestration is runtime policy behavior only).
No additional migration in WI-0066 (reputation circuit-breaker operations are runtime policy behavior only).
No additional migration in WI-0070 (adaptive routing and auto-heal operations are runtime policy behavior only).

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access. Use API/event/projection.
