# WI-0034: Employee and Organization Master Model

## Background and Problem

Core HR entities (Employee / Organization) are currently missing from the database. Existing domains reference `employeeId: String` without referential integrity, which blocks:

- data integrity guarantees
- department/team moves and lifecycle management
- tenant-scoped access control

## Scope

### In Scope

- Define `Employee` and `Organization` (or `Tenant`) domain models contract-first.
- Add Prisma models and migrations for Employee/Organization baseline.
- Introduce minimal API for admin to create/read Employees (MVP admin-only).
- Backfill strategy for existing `employeeId` references (pre-work for FK migration WI).

### Out of Scope

- Full HRIS (positions, compensation history, onboarding).
- Employee self-service UI.

## User Scenarios

1. Admin creates an Employee and receives a stable employee identifier.
2. Attendance/leave/payroll can reference a real Employee entity (FK-ready).

## Payroll Accuracy and Calculation Rules

- Not applicable (master data).

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Create/Read employee master data | Allow | Deny | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables: add Employee/Organization baseline (exact schema TBD in contract)
- Migration IDs: TBD
- Backward compatibility plan: additive first; no breaking FK enforcement in this WI

## API and Event Changes

- Endpoints: add minimal admin-only Employee CRUD (exact paths TBD in contract)
- Events published: employee.created (TBD)
- Events consumed: none

## Test Plan

- Unit: validation for employee creation payload
- Integration: employee create/read API
- Regression: existing attendance/leave/payroll flows remain unchanged

## Observability and Audit Logging

- Audit events: employee created/updated
- Metrics: not required initially
- Alert conditions: not required

## Rollback Plan

- Feature flag behavior: not applicable
- DB rollback method: revert migration (if safe) or forward-fix
- Recovery target time: 30m

## Definition of Ready (DoR)

- [ ] Employee/Organization contract drafted under `specs/people/` (or similar domain).
- [ ] Data ownership boundaries updated.

## Definition of Done (DoD)

- [ ] Prisma models/migrations merged.
- [ ] Minimal APIs + tests merged.
- [ ] Audit logs emitted for master data mutations.

