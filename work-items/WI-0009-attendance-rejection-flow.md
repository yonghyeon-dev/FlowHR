# WI-0009: Attendance Rejection Flow and Payroll Exclusion Guard

## Background and Problem

Current attendance flow supports create/update/approve only.  
Operationally, managers need an explicit rejection action to block invalid records from payroll aggregation without deleting history.

## Scope

### In Scope

- Add manager/admin rejection endpoint for attendance records.
- Enforce `PENDING -> REJECTED` transition guard.
- Ensure rejected records are excluded from payroll preview aggregation.
- Emit audit/domain events for rejection action.

### Out of Scope

- Attendance delete/hard-delete behavior.
- Rejection reason capture schema migration.
- Reopen/resubmission workflow for rejected attendance.

## User Scenarios

1. Manager rejects an invalid pending attendance record and the record transitions to `REJECTED`.
2. Payroll operator runs preview and rejected attendance is not included in `sourceRecordCount` or totals.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: payroll aggregation includes `APPROVED` attendance only.
- Rounding rule: existing KRW/minute rounding rules remain unchanged.
- Exception handling rule: duplicate rejection attempts fail with `409`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Reject attendance record | Allow | Allow | Deny | Deny |
| Approve attendance record | Allow | Allow | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables: `AttendanceRecord`, `AuditLog`
- Migration IDs: none
- Backward compatibility plan: additive API/event change only, no schema migration

## API and Event Changes

- Endpoints:
  - `POST /api/attendance/records/{recordId}/reject`
- Events published:
  - `attendance.rejected.v1`
- Events consumed:
  - none

## Test Plan

- Unit:
  - state transition guard (`PENDING` only)
- Integration:
  - manager rejection success
  - duplicate rejection blocked (`409`)
- Regression:
  - WI-0001 memory/prisma e2e remains green
- Authorization:
  - employee rejection denied (`403`)
- Payroll accuracy:
  - rejected record excluded from preview `sourceRecordCount`

## Observability and Audit Logging

- Audit events:
  - `attendance.rejected`
- Metrics:
  - `attendance_rejection_count`
- Alert conditions:
  - rejection failure spike (`4xx/5xx`)

## Rollback Plan

- Feature flag behavior: no new flag, rollback by reverting route/service change.
- DB rollback method: not applicable (no migration).
- Recovery target time: 30m.

## Definition of Ready (DoR)

- [ ] Requirements are unambiguous and testable.
- [ ] Domain contract drafted or updated.
- [ ] Role matrix reviewed by QA.
- [ ] Data migration impact assessed.
- [ ] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.
