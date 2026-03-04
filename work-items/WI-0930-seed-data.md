# WI-0930 Prisma Seed Data + Default Role Bootstrap

## Scope
- Add a Prisma seed entrypoint for first-boot default data.
- Bootstrap default organization + RBAC roles for production/local initialization.
- Keep seed behavior idempotent so repeated runs are safe.

## Implementation
- Added [`prisma/seed.ts`](prisma/seed.ts):
  - Seeds default organization: `FlowHR Demo Org (for development)`.
  - Seeds default roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE`.
  - Stores role permissions from JSON-array role definitions.
  - Uses `upsert` for organization and roles.
  - Checks existing role permissions before rewriting mappings.
  - Includes comment-only bootstrap instructions for creating the first admin user.
- Updated [`package.json`](package.json):
  - Added `prisma.seed` config: `tsx prisma/seed.ts`.
  - Added script: `db:seed` -> `npx prisma db seed`.

## Test
- Added [`scripts/tests/e2e-wi0930-seed-data.test.ts`](scripts/tests/e2e-wi0930-seed-data.test.ts):
  - Runs `seedFlowHrDefaults` against an in-memory seed store.
  - Verifies default roles and permissions.
  - Verifies idempotency by running seed twice and confirming stable counts/state.

## Data Changes
- No schema migration added in this work item.
