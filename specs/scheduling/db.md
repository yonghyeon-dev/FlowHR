# Scheduling DB Notes

## Tables

- `WorkSchedule`
  - `employeeId` -> `Employee.id` (FK enforced)
- `WorkScheduleTemplate`
  - `organizationId` -> `Organization.id` (FK enforced)
  - `weekdays` int array (1=Mon ... 7=Sun)

## Migrations

- `202602150003_scheduling_baseline`
- `202602160001_scheduling_template_recurring`

## Tenant Isolation

- RLS policies must enforce tenant isolation via `Employee.organizationId`.
- `WorkScheduleTemplate` is tenant-scoped directly via `organizationId`.

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access. Use API/event/projection.

