# WI-0921 Supabase Session -> API Actor Header Bridge

## Scope
- Add a shared frontend API client that reads Supabase session `app_metadata` and maps actor headers automatically.
- Remove employee/admin hardcoded actor header wiring in `src/app`.
- Remove `EMP-1001` hardcoded literals under `src/app`.
- Add regression test for the bridge and hardcoding cleanup.

## Implementation
- Added `src/lib/api-client.ts`:
  - Reads current Supabase session via `getSupabaseClient().auth.getSession()`.
  - Extracts actor claims from `session.user.app_metadata`:
    - `role`
    - `actor_id` (fallback keys: `employee_id`, `actorId`, `employeeId`)
    - `organization_id` (fallback key: `organizationId`)
  - Builds request headers:
    - `authorization: Bearer <access_token>`
    - `x-actor-role`
    - `x-actor-id`
    - `x-actor-organization-id` (when present)
  - Redirects to `/login` when session or required actor metadata is missing.
  - Exposes:
    - `resolveApiActorSession`
    - `resolveActorHeadersFromSupabaseSession`
    - `apiClientFetch`
    - `parseApiResponseBody`

- Employee flow updates:
  - `src/app/employee/page-api-helpers.ts`
    - Switched from local header fallback logic to `apiClientFetch`.
  - `src/app/employee/page-session-helpers.ts`
    - Removed `EMP-1001` fallback (`employeeId` now bound from Supabase actor session only).
  - `src/app/employee/page-action-helpers.ts`
    - Removed `DEV_FALLBACK_EMPLOYEE_ID` and `allowDevEmployeeIdFallback`.
    - Guarded create/leave actions when session actor binding is empty.
  - `src/app/employee/page-mutation-actions.ts`
    - Removed `allowDevEmployeeIdFallback` wiring.
  - `src/app/employee/page-mutation-runtime.ts`
    - Removed manual bearer/header fallback inputs and delegated request auth/header setup to `api-client`.
  - `src/app/employee/payslips/use-payslip-api.ts`
    - Replaced manual header construction with `apiClientFetch`.

- Admin flow updates:
  - `src/app/admin/page-api-helpers.ts`
    - Replaced manual actor header/bearer branching with `apiClientFetch`.
  - `src/app/admin/page.tsx`
    - Updated `performAdminApiCall` usage to new simplified input.
  - `src/app/admin/people/page-directory-actions.ts`
    - Replaced local header assembly with `apiClientFetch`.
  - `src/app/admin/approval-templates/page.tsx`
  - `src/app/admin/approval-history/page.tsx`
  - `src/app/admin/approval-policy/page.tsx`
  - `src/app/admin/approval-executions/page.tsx`
    - Replaced local actor header wiring with `apiClientFetch`.

- Hardcoded employee id cleanup under `src/app`:
  - Replaced `EMP-1001` literals with `defaultEmployeeIdForApi` in:
    - `src/app/admin/page-state.ts`
    - `src/app/admin/approval-policy/page.tsx`
    - `src/app/ops/mvp-console/page.tsx`
    - `src/app/ops/admin-console/page.tsx`

## Test
- Added `scripts/tests/e2e-wi0921-session-api-bridge.test.ts`:
  - Verifies no `EMP-1001` literal remains in `src/app/**`.
  - Verifies `src/lib/api-client.ts` exists.
  - Verifies required `api-client` exports exist.

## Verification
- `npm.cmd run typecheck`
- `npm.cmd run lint`
