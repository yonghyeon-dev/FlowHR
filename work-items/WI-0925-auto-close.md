# WI-0925 Attendance Auto-Close for Missing Clock-Out

## Scope
- Add admin-only API `POST /api/attendance/auto-close`.
- Detect attendance records with no `clockOut` after 12 hours from `clockIn`.
- Auto-close detected records by setting `clockOut = clockIn + 9h`.
- Mark auto-closed records with `anomalyType: "AUTO_CLOSED"`.
- Write audit logs for each auto-closed record.
- Add e2e coverage for success, non-impact, and authorization behavior.

## Implementation
- `src/app/api/attendance/auto-close/route.ts`
  - Added admin-only POST route for attendance auto-close execution.
  - Returns `closedCount` and `records`.
  - Returns `401` for unauthenticated requests and `403` for non-admin roles.

- `src/features/attendance/service.ts`
  - Added `autoCloseAttendanceRecords` service method.
  - Applies default policy:
    - stale threshold: `12h`
    - default work duration: `9h`
  - Finds open records older than threshold and updates each with:
    - `checkOutAt = checkInAt + 9h`
    - `anomalyType = "AUTO_CLOSED"`
  - Appends `attendance.auto_closed` audit log entries.

- `src/features/shared/data-access.ts`
  - Added `anomalyType?: string` to `AttendanceRecordEntity`.
  - Added `anomalyType` fields to attendance create/update inputs.
  - Added `AttendanceStore.listOpenRecordsNeedingAutoClose(...)`.

- `src/features/shared/memory-data-access.ts`
  - Persisted `anomalyType` in attendance create/update flows.
  - Implemented `listOpenRecordsNeedingAutoClose(...)`.

- `src/features/shared/prisma-data-access.ts`
  - Persisted `anomalyType` in attendance create/update flows.
  - Implemented `listOpenRecordsNeedingAutoClose(...)`.
  - Normalized nullable DB value to optional entity field.

- `prisma/schema.prisma`
  - Added `AttendanceRecord.anomalyType String?`.

- `prisma/migrations/202603050004_wi0925_attendance_auto_close/migration.sql`
  - Added nullable `anomalyType` column to `AttendanceRecord`.

- `scripts/tests/e2e-wi0925-auto-close.test.ts`
  - Added e2e test that verifies:
    - stale open record is auto-closed
    - `anomalyType` is set to `AUTO_CLOSED`
    - normal completed record is unchanged
    - recent open record is unchanged
    - audit log is recorded
    - `employee` role gets `403`

## Verification
- `npx tsx scripts/tests/e2e-wi0925-auto-close.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

## Data Changes
- Prisma model: `AttendanceRecord`
- Migration: `202603050004_wi0925_attendance_auto_close`
