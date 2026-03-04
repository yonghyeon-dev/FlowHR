# WI-0933: Attendance anomaly analysis report API for admins

## Scope
- Add admin-only attendance anomaly list API:
  - `GET /api/admin/attendance/anomalies`
- Add admin-only attendance anomaly CSV export API:
  - `GET /api/admin/attendance/anomalies/export`
- Add e2e coverage:
  - `scripts/tests/e2e-wi0933-anomaly-report.test.ts`

## Requirements
- Query params:
  - `from`, `to` (required ISO date range)
  - `anomalyType?`: `LATE_CLOCK_IN | EARLY_CLOCK_OUT | MISSING_CLOCK_OUT | AUTO_CLOSED | OVERTIME`
  - `employeeId?`, `departmentId?`
  - `limit?` (default 50, max 200), `offset?`
- List response:
  - `{ items: AttendanceRecordEntity[], total: number, summary: { totalAnomalies, byType } }`
- Export response:
  - `Content-Type: text/csv` with UTF-8 BOM
  - Columns: `employeeName,date,clockIn,clockOut,anomalyType,workHours`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0933-anomaly-report.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
