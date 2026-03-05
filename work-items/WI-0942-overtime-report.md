# WI-0942: Overtime Hours Cumulative Report for Admin Analytics

## Background and Problem

Admins need an overtime-focused report that summarizes accumulated hours by employee for month, quarter, and year periods.
Without this visibility, labor law risk indicators (sustained weekly overwork and excess overtime) are hard to detect early.

## Scope

### In Scope

- Add `GET /api/admin/reports/overtime`:
  - admin role only
  - required query:
    - `period`: `monthly` | `quarterly` | `yearly`
    - `year`: number
  - conditional required query:
    - `month` when `period=monthly`
    - `quarter` when `period=quarterly`
  - optional query:
    - `departmentId`
    - `limit` (default `50`)
    - `offset`
  - response:
    - `items[]` with:
      - `employeeId`, `employeeName`, `departmentName`
      - `regularHours`, `overtimeHours`, `totalHours`
      - `weeklyAverage`, `exceededWeeks`
    - `total`
    - `period` metadata (`type`, `year`, `month?`, `quarter?`)
- Add `GET /api/admin/reports/overtime/export`:
  - same query parameters
  - returns CSV with UTF-8 BOM
- Add e2e coverage for monthly/quarterly aggregation, CSV export format, and employee-role access denial.

### Out of Scope

- Admin analytics dashboard UI integration.
- Country-specific legal threshold customization.
- Scheduled alert delivery based on overtime risk.

## API and Validation Notes

- Role guard: only `admin` can access both endpoints (`403` for `employee`).
- Query validation:
  - `month` required only for monthly period.
  - `quarter` required only for quarterly period.
  - `limit` and `offset` are bounded integers.
- Period boundaries are resolved in Asia/Seoul timezone.

## Test Plan

- `scripts/tests/e2e-wi0942-overtime-report.test.ts`
  - seed overtime-heavy attendance records
  - call monthly report and verify hours aggregation
  - call quarterly report and verify cross-month aggregation
  - call export endpoint and verify UTF-8 BOM + CSV header/rows
  - verify `employee` role receives `403`

## Rollback Plan

- Remove `/api/admin/reports/overtime` and `/api/admin/reports/overtime/export`.
- Remove overtime report shared query/aggregation helper.
- Remove WI-0942 e2e test and work-item document.

