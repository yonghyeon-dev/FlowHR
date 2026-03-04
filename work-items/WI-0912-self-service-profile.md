# WI-0912 Self-Service Employee Profile Update

## Scope
- Allow employees to update their own contact profile fields through:
  - `PATCH /api/people/employees/[employeeId]`
- Keep admin update behavior unchanged.
- Add contact fields to employee domain model:
  - `phone?: string`
  - `address?: string`

## API Changes
- File: `src/app/api/people/employees/[employeeId]/route.ts`
- Behavior:
  - Existing admin/manager flows remain available.
  - `employee` role is allowed only when `actorId === employeeId`.
  - For `employee` self-service, only these fields are writable:
    - `name`, `email`, `phone`, `address`
  - For `employee` self-service, these fields are rejected with `403`:
    - `organizationId`, `departmentId`, `positionId`, `active`

## Data Model Changes
- File: `src/features/shared/data-access.ts`
  - Add `phone?: string`, `address?: string` to `EmployeeEntity`
  - Add `phone?: string`, `address?: string` to `CreateEmployeeInput`
  - Add `phone?: string`, `address?: string` to `UpdateEmployeeInput`
- File: `src/features/shared/memory-data-access.ts`
  - Apply `phone`/`address` in employee create/update flow

## Service Guard Changes
- File: `src/features/people/service.ts`
- `updateEmployee` now supports employee self-service updates without requiring
  `people.employees.manage`, but only for allowed contact fields.
- Non-self updates continue to require people management permission.

## Test
- New e2e: `scripts/tests/e2e-wi0912-self-service-profile.test.ts`
- Validates:
  - employee self `phone/address` patch -> `200`
  - employee patch to another employee -> `403`
  - employee patch with `departmentId` -> `403`
  - admin patch to any employee -> `200`

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0912-self-service-profile.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
