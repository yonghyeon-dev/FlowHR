# People Test Cases (Contract v0.1.0)

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
- Non-admin requests are rejected with `403`.

## Audit and Events

- `organization.created` audit entry is written on org creation.
- `employee.created` audit entry is written on employee creation.
- `employee.profile.updated` audit entry is written on employee update.
- Domain events are published:
  - `organization.created.v1`
  - `employee.created.v1`
  - `employee.profile.updated.v1`

