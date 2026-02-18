# WI-0102: Department and Position Master Model

## Background and Problem

Current People domain manages only `Organization` and `Employee`, so core org structure (department/position) cannot be modeled. This blocks practical HR operations such as department-level assignment, role cataloging, and employee profile completeness.

## Scope

### In Scope

- Add People master entities for department and position.
- Link employee profile to department and position.
- Add admin APIs for create/list/get/update department and position.
- Extend people contract/spec/test-cases and add e2e coverage.

### Out of Scope

- Organization chart visualization.
- Department hierarchy (parent-child tree).
- Compensation grade matrix and job family engine.

## User Scenarios

1. Admin creates departments/positions per organization and reuses them in employee profile setup.
2. Admin assigns an employee to department/position with organization consistency validation.

## Payroll Accuracy and Calculation Rules

- Not applicable.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Create/list/get/update department | Allow | Deny | Deny | Allow |
| Create/list/get/update position | Allow | Deny | Deny | Allow |
| Assign department/position on employee profile | Allow | Deny | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables: `Department`, `Position`, `Employee`
- Migration IDs: `202602180003_people_department_position`
- Backward compatibility plan: additive schema change with nullable employee references.

## API and Event Changes

- Endpoints:
  - `GET /people/departments`
  - `POST /people/departments`
  - `GET /people/departments/{departmentId}`
  - `PATCH /people/departments/{departmentId}`
  - `GET /people/positions`
  - `POST /people/positions`
  - `GET /people/positions/{positionId}`
  - `PATCH /people/positions/{positionId}`
  - `POST /people/employees` (departmentId, positionId support)
  - `PATCH /people/employees/{employeeId}` (departmentId, positionId support)
- Events published:
  - `department.created.v1`
  - `department.updated.v1`
  - `position.created.v1`
  - `position.updated.v1`
- Events consumed: none

## Test Plan

- Unit: people payload/query validation for department/position create/update.
- Integration: org consistency guard between employee and department/position assignment.
- Regression: existing people, attendance, leave, payroll APIs remain unchanged.
- Authorization: non-admin requests are rejected with `403`.

## Observability and Audit Logging

- Audit events:
  - `department.created`
  - `department.updated`
  - `position.created`
  - `position.updated`
  - `employee.profile.updated`
- Metrics:
  - `people_department_created_count`
  - `people_position_created_count`
- Alert conditions:
  - repeated `409` from organization mismatch validation.

## Rollback Plan

- Feature flag behavior: not applicable (people domain baseline).
- DB rollback method: forward-fix preferred; rollback migration only in controlled downtime.
- Recovery target time: 30m.

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Prisma schema/migration and data-access are updated.
- [ ] People APIs and validation are updated.
- [ ] E2E regression coverage is added and passing.
- [ ] Contract/API/test-cases are updated with version bump.
- [ ] QA Spec Gate and Code Gate are both passed.
