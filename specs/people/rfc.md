# RFC: People Domain (Employee/Organization/Department/Position Master)

## Goals

- Introduce first-class `Organization` and `Employee` master entities.
- Introduce organization-scoped `Department` and `Position` catalogs.
- Keep employee identifier aligned with Supabase authentication (`user.id`) for future referential integrity.
- Provide minimal admin-only APIs to create/read/list/update employees, departments, positions, and organizations.

## Non-goals

- Multi-tenant enforcement (RLS) in this RFC.
- RBAC redesign or permission administration UI.
- Full HRIS modules (compensation history, onboarding workflow).

## Key Decisions

- **Employee id**: use Supabase `user.id` (UUID string) as canonical id in production.
- **Organization**: introduced as a placeholder entity; only linked from Employee in v0.1.
- **Department/Position**: organization-scoped catalogs with unique code per organization.
- **Employee assignment consistency**: employee organization must match assigned department/position organization.
- **Security**: all endpoints are admin-only in v0.1; tenant-scoped reads/writes will be added later.

