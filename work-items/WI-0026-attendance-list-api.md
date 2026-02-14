# WI-0026: Attendance Record List API (Query by Period)

## Background and Problem

Current MVP supports creating/updating/approving/rejecting attendance records, but there is no way to query records for verification, audit review, or UI listing.
Operators need a read API to list records by period with basic role boundaries.

## Scope

### In Scope

- Add `GET /attendance/records` to list attendance records filtered by:
  - `from` (ISO datetime with offset)
  - `to` (ISO datetime with offset)
  - optional `employeeId`
  - optional `state`
- Authorization rules:
  - `employee`: can list only own records (employeeId defaults to actor id; cross-employee query forbidden)
  - `manager`: requires `employeeId` (no org model yet, so avoid unbounded reads)
  - `admin`, `payroll_operator`: can list (employeeId optional)

### Out of Scope

- Pagination/ordering beyond default `checkInAt ASC`.
- Org scoping for managers (requires org model).
- Full-text search and exports.

## User Scenarios

1. Employee lists own records for the current month.
2. Payroll operator lists an employee's records for payroll verification.
3. Manager attempts unbounded listing without `employeeId` and gets a clear `400`.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: the list endpoint returns persisted `AttendanceRecord` rows (no derived payroll totals).
- Rounding rule: not applicable.
- Exception handling rule: invalid query params return `400` with details.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| List attendance records (period) | Allow | Allow (employeeId required) | Allow (self only) | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: additive API only

## API and Event Changes

- Endpoints:
  - `GET /attendance/records`
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - query parsing and role boundary guards
- Integration:
  - list returns created records in period
  - employee cross-employee query is blocked with `403`
  - manager missing employeeId is blocked with `400`
- Regression:
  - existing WI-0001 flow remains green
- Authorization:
  - role matrix enforced in route handler
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events:
  - `attendance.records.listed` (optional, not emitted in MVP to avoid noise)
- Metrics:
  - list endpoint latency (future)
- Alert conditions:
  - none

## Rollback Plan

- Feature flag behavior: not applicable (additive endpoint)
- DB rollback method: not applicable
- Recovery target time: immediate by reverting route + service changes

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

