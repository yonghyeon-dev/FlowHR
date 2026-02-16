# RFC: Scheduling Baseline

## Summary

Introduce a `WorkSchedule` + `WorkScheduleTemplate` baseline so managers can assign planned windows and reuse recurring templates.
This is the foundation for Phase 2 scheduling enhancements (rotations, anomaly detection).

## Motivation

- Attendance alone is not enough for operational planning.
- Scheduling needs tenant-safe storage and consistent authorization boundaries.

## Domain Model

`WorkSchedule`:

- `employeeId` (FK to `Employee.id`)
- `startAt`, `endAt` (planned timestamps, ISO datetime)
- `breakMinutes`
- `isHoliday`
- `notes` (optional)

`WorkScheduleTemplate`:

- `organizationId` (FK to `Organization.id`)
- `name`
- `startMinute`, `endMinute` (0..1439)
- `weekdays` (1=Mon ... 7=Sun)
- `breakMinutes`, `isHoliday`, `notes`

## API

- `POST /api/scheduling/schedules`
  - Creates a schedule entry.
  - Emits audit log + domain event.
- `GET /api/scheduling/schedules?from=...&to=...&employeeId=...`
  - Lists schedules by period.
- `POST /api/scheduling/templates`
  - Creates schedule template.
- `GET /api/scheduling/templates`
  - Lists organization templates.
- `POST /api/scheduling/templates/{templateId}/assign`
  - Creates one `WorkSchedule` from template for given employee/date.

## Authorization

- Admin: create/list any.
- Manager: schedule CRUD + template create/list/assign within tenant.
- Employee: list own schedules only (template endpoints denied).

## Tenant Isolation (RLS)

- Enable RLS on `WorkSchedule`.
- Policy enforces tenant match via `Employee.organizationId`.
- Enable RLS on `WorkScheduleTemplate` via `organizationId`.
- `system` role bypass is allowed for platform operations.

## Future Extensions

- Multi-day bulk assignment and rotation engine
- Shift swap requests and approvals
- Schedule vs attendance anomaly detection

