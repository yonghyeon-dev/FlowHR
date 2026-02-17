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
No additional migration in WI-0058 (rotation optimization evaluate/apply is runtime/API behavior only).
No additional migration in WI-0059 (rotation fairness report is read-only runtime/API behavior only).
No additional migration in WI-0061 (rotation fairness write-back orchestration is runtime/API behavior only).
No additional migration in WI-0063 (global fairness constraints are runtime/API behavior only).
No additional migration in WI-0065 (anomaly cockpit dashboard is read-only runtime/API behavior only).
No additional migration in WI-0067 (anomaly cockpit ticket automation is runtime event/audit behavior only).
No additional migration in WI-0068 (anomaly cockpit streaming dashboard is read-only runtime/API/audit behavior only).
No additional migration in WI-0069 (advanced fairness multi-objective solver is runtime/API behavior only).
No additional migration in WI-0071 (cockpit stream incident automation + ops dashboard UI is read-only runtime/API/UI behavior only).
No additional migration in WI-0072 (anomaly incident lifecycle commands are runtime API/audit/event behavior only).
No additional migration in WI-0073 (anomaly incident read-model list/detail APIs are runtime projection behavior only).
No additional migration in WI-0075 (anomaly incident read-model projection source moved to persisted audit logs).
No additional migration in WI-0076 (anomaly incident SLA monitoring API is read-only runtime projection behavior only).
No additional migration in WI-0077 (anomaly incident escalation automation command is runtime projection/event behavior only).
No additional migration in WI-0078 (anomaly incident auto-action execution command is runtime orchestration/event behavior only).

## Tenant Isolation

- RLS policies must enforce tenant isolation via `Employee.organizationId`.
- `WorkScheduleTemplate` is tenant-scoped directly via `organizationId`.

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access. Use API/event/projection.
- Schedule anomaly report reads `AttendanceRecord` signals through service/data-access boundaries only.
- Range assignment writes only `WorkSchedule` rows and reuses existing overlap constraints.
- Rotation assignment writes only `WorkSchedule` rows and reuses existing overlap constraints.

