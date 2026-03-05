# WI-0948: Prevent Attendance Modification After Payroll Finalization

## Background and Problem

Attendance records can currently be edited after payroll has been confirmed for the same month.  
This can break payroll/audit integrity because confirmed payroll results no longer match source attendance.

## Scope

### In Scope

- Add attendance-period finalization guard:
  - helper: `isAttendancePeriodFinalized(organizationId, date)`
  - month-based check for the month containing the attendance date
  - finalized state: `PayrollRun.state === "CONFIRMED"`
- Enforce guard in:
  - `PATCH /api/attendance/records/[recordId]`
  - `DELETE /api/attendance/records/[recordId]`
- Error behavior:
  - return `409 Conflict`
  - message clearly states payroll is finalized for the period
- Keep `POST /api/attendance/records` unchanged.
- Add WI e2e test coverage:
  - `scripts/tests/e2e-wi0948-attendance-immutable.test.ts`

### Out of Scope

- UI changes for attendance edit/delete controls.
- Payroll period lock model redesign.
- Backfill/remediation for previously edited historical attendance.

## API and Validation Notes

- Update/delete attendance in a finalized payroll month returns `409`.
- Error message includes finalized payroll context for operator clarity.
- Clock-in/create endpoint remains allowed.

## Test Plan

- `scripts/tests/e2e-wi0948-attendance-immutable.test.ts`
  - create attendance -> finalize payroll -> `PATCH` returns `409`
  - create attendance -> finalize payroll -> `DELETE` returns `409`
  - create attendance without finalized payroll -> `PATCH` returns `200`
  - assert error mentions finalized payroll

## Rollback Plan

- Remove finalized-period guard helper and calls from attendance update/delete service.
- Remove attendance delete route handler if introduced for this WI.
- Remove WI-0948 e2e test and work-item document.
