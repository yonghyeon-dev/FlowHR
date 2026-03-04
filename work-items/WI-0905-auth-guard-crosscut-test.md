# WI-0905 Auth Guard Crosscut Test

## Scope
- Added `scripts/tests/e2e-wi0905-auth-guard-crosscut.test.ts`.
- Followed the same structural pattern as `scripts/tests/e2e-wi0001.test.ts`:
  - `node:assert/strict` assertions
  - runtime test env setup
  - `actorHeaders` and `jsonRequest` helpers
  - memory data access initialization and `run()` entrypoint

## Scenario
1. Minimal org memory setup:
   - create one organization
   - create one employee bound to the organization
2. Without auth headers, call GET:
   - `/api/attendance/records`
   - `/api/leave/requests`
   - `/api/payroll/runs`
   - `/api/people/employees`
   - `/api/scheduling/schedules`
3. Verify all unauthenticated requests are rejected with `401` or `403`.
4. With employee auth headers, call the same GET endpoints.
5. Verify all authenticated GET responses are `200` (empty list allowed).
6. Verify role boundary for employee actor:
   - `POST /api/payroll/runs/preview` returns `403`
   - `POST /api/people/employees` returns `403`

## Validation Points
- Unauthenticated requests are consistently blocked across key APIs.
- Authenticated employee requests are allowed within expected scope.
- Employee role cannot access admin-only write operations.

## Verification
- `npm.cmd run typecheck`
- `npm.cmd run lint`
