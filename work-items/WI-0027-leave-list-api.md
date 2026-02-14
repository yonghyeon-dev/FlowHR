# WI-0027: Leave Request List API (Query by Period)

## Background and Problem

Leave requests can be created/updated/approved/rejected/canceled, but there is no read API to list requests for UI rendering, audits, or payroll verification.

## Scope

### In Scope

- Add `GET /leave/requests` to list leave requests overlapping a period:
  - `from` (ISO datetime with offset)
  - `to` (ISO datetime with offset)
  - optional `employeeId`
  - optional `state`
- Authorization rules:
  - `employee`: can list only own requests (employeeId defaults to actor id; cross-employee query forbidden)
  - `manager`: requires `employeeId` (org model not present yet)
  - `admin`, `payroll_operator`: can list (employeeId optional)

### Out of Scope

- Pagination and cursor-based listing.
- Org scoping for managers.
- Calendar sync and external integrations.

## User Scenarios

1. Employee lists own leave requests for a month.
2. Payroll operator lists an employee's approved leave requests for payroll review.
3. Manager omits `employeeId` and receives a clear `400` to avoid unbounded reads.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: list endpoint returns persisted `LeaveRequest` rows.
- Rounding rule: not applicable.
- Exception handling rule: invalid query params return `400`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| List leave requests (period overlap) | Allow | Allow (employeeId required) | Allow (self only) | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: additive API only

## API and Event Changes

- Endpoints:
  - `GET /leave/requests`
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - query parsing and role boundary guards
- Integration:
  - list returns created requests overlapping the period
  - employee cross-employee list query is blocked with `403`
  - manager list query requires employeeId (`400`)
- Regression:
  - existing WI-0002 flow remains green
- Authorization:
  - role matrix enforced in route handler
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events: none for MVP (avoid noise)
- Metrics: none
- Alert conditions: none

## Rollback Plan

- Feature flag behavior: not applicable (additive endpoint)
- DB rollback method: not applicable
- Recovery target time: immediate by revert

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

