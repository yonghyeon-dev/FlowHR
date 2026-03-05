# WI-0953: Department Attendance Summary Report API

## Scope

- Add admin-only API endpoint:
  - `GET /api/admin/reports/attendance/department-summary`
- Add e2e coverage:
  - `scripts/tests/e2e-wi0953-dept-attendance-summary.test.ts`

## Requirements

- Query params:
  - `startDate`, `endDate` (required `YYYY-MM-DD`)
  - `organizationId` resolved from admin session actor context
- Role guard:
  - Admin-only (`403` for non-admin)
- Response shape:
  - Array of per-department summary rows:
    - `departmentId`, `departmentName`
    - `employeeCount` (ACTIVE employees only)
    - `totalWorkHours`, `avgWorkHoursPerEmployee`
    - `lateCount`, `absentCount`, `anomalyCount`
    - `attendanceRate` (percentage)

## Aggregation Rules

- Department list is sourced from the organization departments and includes empty departments.
- Employee denominator uses only employees with `status=ACTIVE`.
- Attendance records are filtered by date range (`checkInAt`) and organization.
- Rejected attendance records are excluded.
- Work hours are computed from `workedMinutes(checkInAt, checkOutAt, breakMinutes)` and converted to hours.
- `lateCount` increments for anomaly types containing `late`.
- `absentCount` increments for anomaly types containing `absent` or `no_show` variants.
- `anomalyCount` increments for any non-empty anomaly type.
- `attendanceRate` is `attendedActiveEmployees / activeEmployees * 100`.

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0953-dept-attendance-summary.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
