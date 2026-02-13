# WI-0016: Attendance Rejection Reason Traceability

## Background and Problem

Attendance rejection currently records only state transition without a structured reason field.
For audit and dispute handling, operators need optional rejection reason trace in audit logs and domain events.

## Scope

### In Scope

- Add optional `reason` payload to attendance reject endpoint.
- Persist rejection reason in `attendance.rejected` audit payload.
- Publish rejection reason in `attendance.rejected.v1` event payload.
- Extend memory/prisma e2e tests for reason trace assertions.

### Out of Scope

- DB schema change for dedicated rejection reason column.
- Rejection reason taxonomy/enum standardization.
- Resubmission workflow for rejected attendance.

## User Scenarios

1. Manager rejects attendance and provides reason for audit.
2. Payroll/QA can trace rejection reason from audit/event stream when reviewing excluded records.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: payroll aggregation still includes `APPROVED` records only.
- Rounding rule: not applicable.
- Exception handling rule: invalid JSON or oversize reason payload returns `400`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Reject attendance with optional reason | Allow | Allow | Deny | Deny |
| Read rejection trace from audit logs | Allow | Allow | Deny | Allow (ops only) |

## Data Changes (Tables and Migrations)

- Tables: `AttendanceRecord`, `AuditLog`
- Migration IDs: none
- Backward compatibility plan: additive request payload only, no schema change

## API and Event Changes

- Endpoints:
  - `POST /api/attendance/records/{recordId}/reject` (optional `{ reason }`)
- Events published:
  - `attendance.rejected.v1` (payload includes optional `reason`)
- Events consumed:
  - none

## Test Plan

- Unit:
  - reject payload schema (`reason` optional, max length check)
- Integration:
  - reject request with reason succeeds and returns `REJECTED`
  - invalid reject JSON payload fails with `400`
- Regression:
  - WI-0001 memory/prisma e2e stays green
- Authorization:
  - manager/admin only reject path
- Payroll accuracy:
  - rejected records remain excluded from payroll preview count

## Observability and Audit Logging

- Audit events:
  - `attendance.rejected` payload includes `reason` when provided
- Metrics:
  - `attendance_rejection_count`
- Alert conditions:
  - spike in reject validation errors (`400`)

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable (no migration).
- Recovery target time: 15m by reverting route/service payload change.

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
