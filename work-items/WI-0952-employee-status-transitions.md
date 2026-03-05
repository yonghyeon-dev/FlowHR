# WI-0952: Employee Status Transitions

## Summary

- Replace employee boolean `active` persistence with enum `status`.
- Supported status values:
  - `ACTIVE`
  - `ON_LEAVE`
  - `RESIGNED`
- Supported transitions:
  - `ACTIVE -> ON_LEAVE`
  - `ACTIVE -> RESIGNED`
  - `ON_LEAVE -> ACTIVE`
  - `ON_LEAVE -> RESIGNED`
- `RESIGNED` is terminal.
- On transition to `RESIGNED`, invalidate Supabase sessions when employee id is a Supabase user UUID.

## API

- `GET /api/people/employees`
  - Adds optional `status` filter query param.
  - Keeps backward-compatible `active` query filter behavior.
- `GET /api/employees`
  - Alias listing endpoint with same `status`/`active` filters.
- `PATCH /api/employees/{id}/status`
  - Body: `{ status, reason?, effectiveDate? }`
  - Admin-only route.
  - Validates transition rules and returns updated employee.

## Data Changes

- Migration ID: `202603050011_add_employee_status`.
- Table updated: `Employee` (field rename: active -> status).

## Compatibility

- Prisma `Employee.active` column replaced by `Employee.status`.
- Backward compatibility preserved by returning computed `active` (`status === ACTIVE`) in employee entities/responses.
- Legacy `active` writes map to status:
  - `active: true` -> `ACTIVE`
  - `active: false` -> `ON_LEAVE`

## Validation and Side Effects

- Invalid/same-state transitions return `400` with clear transition error message.
- `RESIGNED` -> any next state returns `400` (`cannot transition from RESIGNED`).
- Status transition writes audit action: `employee.status.transitioned`.
- Domain event emitted: `employee.status.transitioned.v1`.

## Test Coverage

- Added `scripts/tests/e2e-wi0952-employee-status.test.ts` for:
  - `ACTIVE -> ON_LEAVE` (`200`)
  - `ACTIVE -> RESIGNED` (`200`)
  - `RESIGNED -> ACTIVE` (`400`)
  - `ON_LEAVE -> ACTIVE` (`200`)
  - Employee list with `status` filter
  - Invalid transition error clarity
