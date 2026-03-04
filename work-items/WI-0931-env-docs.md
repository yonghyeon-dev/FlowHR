# WI-0931 Environment Variable Documentation + Production Deploy Checklist

## Scope
- Ensure required runtime environment variables are clearly documented.
- Add a production deployment checklist for consistent release readiness.
- Add automated checks for env documentation coverage and basic secret hygiene.

## Implementation
- Updated [`.env.example`](.env.example):
  - Documented required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
  - Documented optional vars: `DIRECT_URL`, `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.
  - Added clear comments, including `server-only` guidance for service role key and `dev only` guidance for dev tools.
- Added [`docs/deploy-checklist.md`](docs/deploy-checklist.md):
  - `Pre-deploy`
  - `Supabase setup`
  - `Vercel setup`
  - `Post-deploy`
  - `Rollback procedure`
- Added [`scripts/tests/e2e-wi0931-env-docs.test.ts`](scripts/tests/e2e-wi0931-env-docs.test.ts):
  - Verifies env variable docs exist with description comments.
  - Verifies deploy checklist exists and includes required sections.
  - Performs a basic hardcoded secret pattern scan in `src/`.

## Test
- `tsx scripts/tests/e2e-wi0931-env-docs.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

