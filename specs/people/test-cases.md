# People Test Cases (Contract v0.3.20)

## Organization

- Admin can create an organization.
- Admin can list organizations.
- Admin can fetch an organization by id.
- Admin can read `/admin/operator-alerts` for organization fallback webhook settings.
- Admin can update `/admin/operator-alerts` with webhook URL/provider and per-flow toggles.
- Empty operator-alert webhook URL clears the stored organization fallback and leaves env fallback behavior intact.
- Non-admin requests are rejected with `403`.

## Employee

- Admin can create an employee with id (recommended Supabase user.id).
- Duplicate employee create returns `409`.
- Admin can list employees (filter by `active` and `organizationId`).
- Admin can list employees with `status` filter (`ACTIVE`/`ON_LEAVE`/`RESIGNED`).
- Admin can fetch an employee by id.
- Admin can update employee profile fields (name/email/org/active).
- Admin can transition employee status via `PATCH /employees/{id}/status`.
- `ACTIVE -> ON_LEAVE` transition succeeds (`200`).
- `ACTIVE -> RESIGNED` transition succeeds (`200`).
- `ON_LEAVE -> ACTIVE` transition succeeds (`200`).
- `RESIGNED -> ACTIVE` is rejected (`400`) as terminal-state transition.
- Same-state or unsupported transition is rejected (`400`) with clear message.
- Admin can list employee profile history (`/people/employees/{employeeId}/history`) with newest entries first.
- Employee create/update supports optional `departmentId`, `positionId`.
- Employee update returns `409` when department/position organization mismatches target employee organization.
- Non-admin requests are rejected with `403`.

## Department and Position

- Admin can create/list/get/update department.
- Admin can create/list/get/update position.
- Duplicate code in same organization returns `409`.
- Same code across different organizations is allowed.
- Non-admin requests are rejected with `403`.

## Audit and Events

- `organization.created` audit entry is written on org creation.
- `department.created` and `department.updated` audit entries are written on department mutation.
- `position.created` and `position.updated` audit entries are written on position mutation.
- `employee.created` audit entry is written on employee creation.
- `employee.profile.updated` audit entry is written on employee update.
- `employee.status.transitioned` audit entry is written on status transition.
- Domain events are published:
  - `organization.created.v1`
  - `department.created.v1`
  - `department.updated.v1`
  - `position.created.v1`
  - `position.updated.v1`
  - `employee.created.v1`
  - `employee.profile.updated.v1`
  - `employee.status.transitioned.v1`

## Benefits Read Model Persistence

- Benefits catalog item create/list/find/update are persisted through runtime data access.
- Benefits request create/list/find/update are persisted through runtime data access.
- `ORG-DEMO` receives one-time seed for legacy benefits catalog/request sample data.
- Existing benefits API routes preserve behavior while switching to async store calls.
- Benefits DB migration is additive only and does not break existing people/benefits APIs.
- Admin/manager can toggle benefits catalog item status via `/benefits/catalog/{benefitId}/status`.
- Benefits request create returns `409` when target catalog status is `INACTIVE`.
- Benefits request create returns `409` on benefit organization mismatch.
- Benefits request decision returns `409` when request status is not `SUBMITTED`.
- Benefits catalog status update returns `409` when trying to deactivate an item with submitted pending requests.
- Benefits request list supports `sort=pending_priority` and returns submitted requests first (oldest submitted first).
- Recruitment referral list supports `sort=stalled_priority` and returns active stalled referrals first.

## Notices

- Admin or manager can partially update a draft notice via `PATCH /notices/{noticeId}`.
- Admin or manager can partially update a scheduled notice via `PATCH /notices/{noticeId}` without clearing `publishAt`.
- Title-only patch preserves existing body, audience, and scheduling metadata.
- Body-only patch preserves existing title, audience, and scheduling metadata.
- Empty patch payload `{}` returns `400`.
- Published notice patch attempts return `409`.

