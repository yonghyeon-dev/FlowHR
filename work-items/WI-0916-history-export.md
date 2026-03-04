# WI-0916 Employee History CSV Export

## Scope
- Add an admin-only API to export employee change history as CSV.
- Endpoint: `GET /api/people/employees/[employeeId]/history/export`
- Output format:
  - `Content-Type: text/csv`
  - UTF-8 with BOM
  - Columns: `date,action,field,oldValue,newValue,actorId`

## Implementation
- Added route:
  - `src/app/api/people/employees/[employeeId]/history/export/route.ts`
- Behavior:
  - Auth required.
  - Only `admin` role is allowed (`403` for non-admin).
  - Validates target employee existence (`404` if missing).
  - Reads employee-related audit logs from `dataAccess.audit.list` with:
    - actions: `employee.created`, `employee.profile.updated`
    - entityType: `Employee`
    - entityId: target employee ID
  - Flattens audit payload into CSV rows:
    - `before/after` payload: emit one row per changed field.
    - object payload: emit one row per payload key.
    - fallback payload: emit one row as `field=payload`.
  - Includes fallback parsing when `employee.history` exists but audit rows are empty.
  - Returns CSV with UTF-8 BOM and download filename.

## Test
- Added:
  - `scripts/tests/e2e-wi0916-history-export.test.ts`
- Coverage:
  - Organization/department/employee setup.
  - Employee PATCH updates (name and department).
  - Export call assertions:
    - `200`
    - `Content-Type` starts with `text/csv`
    - BOM exists
    - CSV header matches required columns
    - Rows include name-change and department-change entries
  - Non-admin (`employee`) export call returns `403`.

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0916-history-export.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

