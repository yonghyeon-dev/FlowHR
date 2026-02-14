# WI-0034: Employee and Organization Master Model

## Background and Problem

Core HR entities (Employee / Organization) are currently missing from the database. Existing domains reference `employeeId: String` without referential integrity, which blocks:

- data integrity guarantees
- department/team moves and lifecycle management
- tenant-scoped access control

## Scope

### In Scope

- Define `Employee` and `Organization` domain models contract-first.
- Add Prisma models and migrations for Employee/Organization baseline.
- Introduce minimal admin-only APIs:
  - organizations: create/list/get
  - employees: create/list/get/update
- Backfill strategy for existing `employeeId` references (pre-work for FK migration WI).

### Out of Scope

- Full HRIS (positions, compensation history, onboarding).
- Employee self-service UI.

## User Scenarios

1. Admin creates an Employee and receives a stable employee identifier.
2. Attendance/leave/payroll can reference a real Employee entity (FK-ready).
3. Employee id is aligned with Supabase authentication (recommended: use `auth.users.id` as Employee.id).

## Payroll Accuracy and Calculation Rules

- Not applicable (master data).

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Create/Read employee master data | Allow | Deny | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables: `Organization`, `Employee`
- Migration IDs: `202602140005_employee_master`
- Backward compatibility plan: additive first; no breaking FK enforcement in this WI

## API and Event Changes

- Endpoints:
  - `GET /people/organizations`
  - `POST /people/organizations`
  - `GET /people/organizations/{organizationId}`
  - `GET /people/employees`
  - `POST /people/employees`
  - `GET /people/employees/{employeeId}`
  - `PATCH /people/employees/{employeeId}`
- Events published:
  - `organization.created.v1`
  - `employee.created.v1`
  - `employee.profile.updated.v1`
- Events consumed: none

## Test Plan

- Unit: validation for org/employee payload and employee update patch rules
- Integration: org/employee admin-only route behaviors and duplicate create guard
- Regression: existing attendance/leave/payroll flows remain unchanged

## Observability and Audit Logging

- Audit events:
  - `organization.created`
  - `employee.created`
  - `employee.profile.updated`
- Metrics: not required initially
- Alert conditions: not required

## Rollback Plan

- Feature flag behavior: not applicable
- DB rollback method: revert migration (if safe) or forward-fix
- Recovery target time: 30m

## Definition of Ready (DoR)

- [ ] Employee/Organization contract drafted under `specs/people/`.
- [ ] Data ownership boundaries updated.

## Definition of Done (DoD)

- [ ] Prisma models/migrations merged.
- [ ] Minimal APIs + tests merged.
- [ ] Audit logs emitted for master data mutations.
- [ ] Domain events are published and traceability gate remains green.

