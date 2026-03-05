# WI-0940: Position (Job Title) Management Admin Page With CRUD API

## Background and Problem

`/api/people/positions` already exists, but there is no dedicated admin page for position CRUD operations.
Admins need a focused workspace to manage job titles and safely prevent deletion when employees are assigned.

## Scope

### In Scope

- Add `/admin/positions` admin page with:
  - table columns: Title, Grade, Description, Employee Count, Actions
  - add position action
  - edit modal
  - delete confirmation flow
- Update position APIs:
  - `GET /api/people/positions` (verify existing list path)
  - `POST /api/people/positions`
  - `PATCH /api/people/positions/[positionId]`
  - `DELETE /api/people/positions/[positionId]`
- Add fields:
  - `title` (required)
  - `grade` (optional)
  - `description` (optional)
- Add delete guard:
  - block deletion when employees are assigned to the position
  - return `400` with message `Position has assigned employees`
- Enforce admin role for position mutations (POST/PATCH/DELETE).
- Add e2e coverage for API CRUD and role guard.

### Out of Scope

- Position analytics/reporting dashboards.
- Bulk import/export for positions.
- Employee profile UX redesign.

## Data Changes (Tables and Migrations)

- Tables:
  - `Position`
  - `Employee` (relation target only)
- Migration IDs:
  - `202603050009_wi0940_position_management`
- Backward compatibility plan:
  - retain existing code/name/active fields and API compatibility
  - add title/grade/description as additive fields
  - keep name aligned with title for legacy readers

## API and Event Changes

- Endpoints:
  - `GET /api/people/positions`
  - `POST /api/people/positions`
  - `PATCH /api/people/positions/{positionId}`
  - `DELETE /api/people/positions/{positionId}`
- Audit actions:
  - `position.deleted` (new)
- Events published:
  - no new event name added
  - existing `position.created.v1`/`position.updated.v1` payload extended with `title`, `grade`, and `description`

## Test Plan

- `scripts/tests/e2e-wi0940-position-management.test.ts`
  - POST create position returns `201`
  - GET list includes created position
  - PATCH update returns `200`
  - DELETE position with no employees returns `200`
  - DELETE position with assigned employees returns `400`
  - employee role receives `403` for POST/PATCH/DELETE

## Rollback Plan

- Revert position schema and migration changes.
- Revert position API/service/data-access updates.
- Remove `/admin/positions` page and nav link.
- Remove WI-0940 e2e test and work-item file.
