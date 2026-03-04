# WI-0927 Admin Audit Log Viewer API

## Scope
- Add admin-only audit log list API:
  - `GET /api/admin/audit-logs`
- Add admin-only audit log CSV export API:
  - `GET /api/admin/audit-logs/export`
- Support filter/pagination query params on both endpoints:
  - `from`, `to` (required ISO datetime)
  - `entityType`, `actorId`, `action` (optional)
  - `limit` (default `50`, max `200`), `offset`
- Return list payload:
  - `{ items: AuditLogEntity[], total: number }`
- CSV columns:
  - `timestamp,entityType,entityId,action,actorId,changes`

## Implementation
- Added shared audit-log query/filter/csv helper:
  - `src/app/api/admin/audit-logs/shared.ts`
  - Parses and validates query params (including `from <= to`).
  - Provides unified list logic for both runtimes:
    - Memory mode (`FLOWHR_DATA_ACCESS=memory`)
    - Prisma mode (DB-backed)
  - Applies organization, date-range, and optional field filters.
  - Applies pagination (`limit`/`offset`) and computes `total`.
  - Builds CSV output with UTF-8 BOM.

- Added list route:
  - `src/app/api/admin/audit-logs/route.ts`
  - Enforces `admin` role only.
  - Requires actor organization scope.
  - Returns `items` and `total`.

- Added export route:
  - `src/app/api/admin/audit-logs/export/route.ts`
  - Enforces `admin` role only.
  - Reuses same query parser and data filtering path.
  - Returns CSV with `Content-Type: text/csv; charset=utf-8`.

## Test
- Added:
  - `scripts/tests/e2e-wi0927-audit-log-viewer.test.ts`
- Coverage:
  - Organization/employee setup.
  - Action generation by performing:
    - employee creation
    - attendance record creation
  - `GET /api/admin/audit-logs` returns logs and total.
  - `entityType=Employee` filter returns only employee logs.
  - `GET /api/admin/audit-logs/export` returns CSV with `text/csv`.
  - Non-admin (`employee`) receives `403`.

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0927-audit-log-viewer.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
