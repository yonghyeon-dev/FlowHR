# RBAC Test Cases

## Scope

Permission-based authorization for core APIs and admin-only RBAC management endpoints.

## Functional Cases

1. Admin can list roles and permissions.
2. Admin can upsert a role and replace its permission set.
3. Non-admin RBAC role upsert is rejected with 403.
4. Removing a required permission from a role blocks the corresponding API action with 403.
5. Seeded default employee role includes `payroll.run.list.own` and enables payslip self-service list for own confirmed runs.

## Regression Linkage

- Existing vertical slices remain green under seeded default role mappings:
  - `GC-001` to `GC-006`

## QA Gate Expectations

- Spec Gate: permission list and role matrix validated.
- Code Gate: integration/e2e remain green.

