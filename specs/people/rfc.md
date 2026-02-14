# RFC: People Domain (Employee/Organization Master)

## Goals

- Introduce first-class `Organization` and `Employee` master entities.
- Keep employee identifier aligned with Supabase authentication (`user.id`) for future referential integrity.
- Provide minimal admin-only APIs to create/read/list/update employees and create/read/list organizations.

## Non-goals

- Multi-tenant enforcement (RLS) in this RFC.
- RBAC redesign or permission administration UI.
- Full HRIS modules (position, compensation, onboarding).

## Key Decisions

- **Employee id**: use Supabase `user.id` (UUID string) as canonical id in production.
- **Organization**: introduced as a placeholder entity; only linked from Employee in v0.1.
- **Security**: all endpoints are admin-only in v0.1; tenant-scoped reads/writes will be added later.

