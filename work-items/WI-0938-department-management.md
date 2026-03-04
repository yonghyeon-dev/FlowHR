# WI-0938: Department Management Admin Page With CRUD API

## Background and Problem

Departments already exist in the people API, but there is no dedicated admin workspace for CRUD management.
Admin users need a direct page for creating/updating/deleting departments with parent/manager metadata.

## Scope

### In Scope

- Add `/admin/departments` admin page with:
  - table columns: Name, Parent Department, Manager, Employee Count, Actions
  - add department action
  - edit modal
  - delete confirmation flow
- Extend department domain model to support:
  - `parentId`
  - `managerId`
- Update department APIs:
  - `GET /api/people/departments` (verify existing list path)
  - `POST /api/people/departments`
  - `PATCH /api/people/departments/[departmentId]`
  - `DELETE /api/people/departments/[departmentId]`
- Add delete guard:
  - block deletion when employees are assigned to department
  - return `400` with message `Department has assigned employees`
- Add e2e coverage for API CRUD and role guard.

### Out of Scope

- Department analytics/reporting features.
- Advanced org-chart visualization redesign.
- Bulk import/export for departments.

## Data Changes (Tables and Migrations)

- Tables:
  - `Department`
  - `Employee` (relation target only)
- Migration IDs:
  - `202603050008_wi0938_department_management`
- Backward compatibility plan:
  - additive nullable columns (parentId, managerId)
  - existing code/name/active model and APIs remain compatible

## API and Event Changes

- Endpoints:
  - `GET /api/people/departments`
  - `POST /api/people/departments`
  - `PATCH /api/people/departments/{departmentId}`
  - `DELETE /api/people/departments/{departmentId}`
- Audit actions:
  - `department.deleted` (new)
- Events published:
  - no new event name added
  - existing `department.created.v1`/`department.updated.v1` payload extended with `parentId` and `managerId`

## Test Plan

- `scripts/tests/e2e-wi0938-department-management.test.ts`
  - POST create department returns `201`
  - GET list includes created department
  - PATCH update name returns `200`
  - DELETE department with no employees returns `200`
  - DELETE department with assigned employees returns `400`
  - employee role receives `403` for POST/PATCH/DELETE

## Rollback Plan

- Revert department parent/manager schema changes and API/service updates.
- Remove `/admin/departments` page and nav link.
- Remove WI-0938 e2e test and migration.
