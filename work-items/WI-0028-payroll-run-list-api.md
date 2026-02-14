# WI-0028: Payroll Run List API (Query by Period)

## Background and Problem

Payroll runs can be previewed/confirmed, but there is no read API to list runs for operational review, audit, or UI rendering.

## Scope

### In Scope

- Add `GET /payroll/runs` to list payroll runs filtered by:
  - `from` (ISO datetime with offset)
  - `to` (ISO datetime with offset)
  - optional `employeeId`
  - optional `state` (`PREVIEWED|CONFIRMED`)
- Authorization rules:
  - `payroll_operator`, `admin`: allow listing
  - other roles: deny

### Out of Scope

- Employee self-service pay stub UI.
- Pagination and export formats.

## User Scenarios

1. Payroll operator lists payroll runs created for the current month to validate confirmation status.
2. Admin lists all runs in a period to audit changes.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: list endpoint returns persisted `PayrollRun` rows.
- Rounding rule: not applicable.
- Exception handling rule: invalid query params return `400`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| List payroll runs | Allow | Deny | Deny | Allow | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: additive API only

## API and Event Changes

- Endpoints:
  - `GET /payroll/runs`
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - query parsing and role guard
- Integration:
  - list returns created run within period
  - manager/employee list is blocked with `403`
- Regression:
  - existing payroll flows remain green
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

