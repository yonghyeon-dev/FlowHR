# WI-0919 Supabase Signup Metadata Setup

## Scope
- Add an authenticated API endpoint to canonicalize Supabase `auth.users.app_metadata` claims for FlowHR.
- Ensure signup flow initializes required claims (`role`, `organization_id`, `actor_id`) after user creation.
- Keep existing invite flow compatible by running metadata setup on login session hydration.

## Implementation
- Added `POST /api/auth/setup-metadata`:
  - File: `src/app/api/auth/setup-metadata/route.ts`
  - Validates payload:
    - required: `role`, `organization_id`
    - optional: `actor_id`
  - Requires authenticated caller via bearer token (Supabase `auth.getUser`).
  - Updates metadata via Supabase Admin API (`service_role_key` server-side only).
  - Skips update when canonical metadata already matches.
  - Protects against `actor_id` spoofing:
    - verifies employee exists
    - verifies employee belongs to requested organization
    - verifies employee email matches authenticated user email
  - If `actor_id` is omitted, tries to infer from employee email + organization when uniquely resolvable.
- Updated signup page:
  - File: `src/app/(auth)/signup/page.tsx`
  - After `signUp` success:
    - first-user path:
      1. calls `POST /api/people/organizations`
      2. calls `POST /api/people/employees`
      3. calls `POST /api/auth/setup-metadata` with `role=admin`, `organization_id`, `actor_id`
    - invite/metadata-existing path:
      - calls `POST /api/auth/setup-metadata` with existing role + organization for canonicalization/skip behavior.
- Invite compatibility:
  - File: `src/app/login/page.tsx`
  - On session load/auth-state change, attempts background metadata setup when role/org claims exist.
- Bootstrap allowance for tenant-less admin at initial signup:
  - File: `src/features/people/service.ts`
  - Allows `admin` without tenant context to run initial `createOrganization` and `createEmployee` bootstrap paths while preserving existing tenant checks for scoped admins.

## Test
- Added `scripts/tests/e2e-wi0919-metadata-setup.test.ts`.
- Coverage:
  - setup-metadata route file exists
  - POST handler exists
  - missing `role` returns `400`
  - missing `organization_id` returns `400`

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0919-metadata-setup.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
