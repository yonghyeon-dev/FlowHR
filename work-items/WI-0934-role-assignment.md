# WI-0934 Employee Role Assignment API

## Scope
- Provide admin-only APIs to list employee role assignments and update employee roles.
- Prevent self-role changes to avoid admin lock-out.

## API
- `GET /api/admin/employees/roles`
  - Admin-only.
  - Returns all employees with current role assignment:
    - `[{ employeeId, name, email, currentRole, departmentName }]`
- `PATCH /api/admin/employees/[employeeId]/role`
  - Admin-only.
  - Body: `{ role: "admin" | "manager" | "employee" }`
  - Updates the target employee role claim.
  - Returns the updated employee role assignment payload.
  - Rejects self-role change with `400`.

## Implementation Notes
- Added routes:
  - `src/app/api/admin/employees/roles/route.ts`
  - `src/app/api/admin/employees/[employeeId]/role/route.ts`
- Extended RBAC admin service:
  - `listEmployeeRoleAssignments`
  - `updateEmployeeRoleAssignment`
- Added schema for role update payload:
  - `assignEmployeeRoleSchema`

## Test
- Added `scripts/tests/e2e-wi0934-role-assignment.test.ts` covering:
  - Seed employees with admin/manager/employee roles.
  - List role assignments and verify all employees are included.
  - Update employee role and verify change in response/list.
  - Self-role-change attempt returns `400`.
  - Employee role access returns `403`.

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0934-role-assignment.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
