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

No additional migration in WI-0045 (anomaly report is read-only).
No additional migration in WI-0046 (range assignment is runtime/API behavior only).
No additional migration in WI-0047 (rotation assignment is runtime/API behavior only).
No additional migration in WI-0051 (anomaly alert automation is runtime event/audit behavior only).
No additional migration in WI-0055 (anomaly escalation automation is runtime event/audit behavior only).
No additional migration in WI-0057 (rotation balance report is read-only runtime/API behavior only).

## Tenant Isolation

- RLS policies must enforce tenant isolation via `Employee.organizationId`.
- `WorkScheduleTemplate` is tenant-scoped directly via `organizationId`.

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access. Use API/event/projection.
- Schedule anomaly report reads `AttendanceRecord` signals through service/data-access boundaries only.
- Range assignment writes only `WorkSchedule` rows and reuses existing overlap constraints.
- Rotation assignment writes only `WorkSchedule` rows and reuses existing overlap constraints.

