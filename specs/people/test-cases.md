# People Test Cases (Contract v0.3.3)

## Organization

- Admin can create an organization.
- Admin can list organizations.
- Admin can fetch an organization by id.
- Non-admin requests are rejected with `403`.

## Employee

- Admin can create an employee with id (recommended Supabase user.id).
- Duplicate employee create returns `409`.
- Admin can list employees (filter by `active` and `organizationId`).
- Admin can fetch an employee by id.
- Admin can update employee profile fields (name/email/org/active).
- Admin can list employee profile history (`/people/employees/{employeeId}/history`) with newest entries first.
- Employee create/update supports optional `departmentId`, `positionId`.
- Employee update returns `409` when department/position organization mismatches target employee organization.
- Non-admin requests are rejected with `403`.

## Department and Position

- Admin can create/list/get/update department.
- Admin can create/list/get/update position.
- Duplicate code in same organization returns `409`.
- Same code across different organizations is allowed.
- Non-admin requests are rejected with `403`.

## Audit and Events

- `organization.created` audit entry is written on org creation.
- `department.created` and `department.updated` audit entries are written on department mutation.
- `position.created` and `position.updated` audit entries are written on position mutation.
- `employee.created` audit entry is written on employee creation.
- `employee.profile.updated` audit entry is written on employee update.
- Domain events are published:
  - `organization.created.v1`
  - `department.created.v1`
  - `department.updated.v1`
  - `position.created.v1`
  - `position.updated.v1`
  - `employee.created.v1`
  - `employee.profile.updated.v1`

## Benefits Read Model Persistence

- Benefits catalog item create/list/find/update are persisted through runtime data access.
- Benefits request create/list/find/update are persisted through runtime data access.
- `ORG-DEMO` receives one-time seed for legacy benefits catalog/request sample data.
- Existing benefits API routes preserve behavior while switching to async store calls.
- Benefits DB migration is additive only and does not break existing people/benefits APIs.

