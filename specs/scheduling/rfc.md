# RFC: Scheduling Baseline

## Summary

Introduce a minimal `WorkSchedule` domain so managers can assign planned working windows per employee.
This is the foundation for Phase 2 scheduling enhancements (templates, rotations, anomaly detection).

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

## API

- `POST /api/scheduling/schedules`
  - Creates a schedule entry.
  - Emits audit log + domain event.
- `GET /api/scheduling/schedules?from=...&to=...&employeeId=...`
  - Lists schedules by period.

## Authorization

- Admin: create/list any.
- Manager: create schedules within tenant; list requires `employeeId`.
- Employee: list own schedules only.

## Tenant Isolation (RLS)

- Enable RLS on `WorkSchedule`.
- Policy enforces tenant match via `Employee.organizationId`.
- `system` role bypass is allowed for platform operations.

## Future Extensions

- Schedule templates / recurring shifts
- Shift swap requests and approvals
- Schedule vs attendance anomaly detection

