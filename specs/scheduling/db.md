# Scheduling DB Notes

## Tables

- `WorkSchedule`
  - `employeeId` -> `Employee.id` (FK enforced)

## Migrations

- `202602150003_scheduling_baseline`

## Tenant Isolation

- RLS policies must enforce tenant isolation via `Employee.organizationId`.

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access. Use API/event/projection.

