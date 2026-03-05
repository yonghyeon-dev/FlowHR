# WI-0964: Auth callback org/employee setup on first email verification

## Background

When `enable_confirmations=true` in Supabase, signup completes without an active session. The signup page cannot create organization/employee records or set canonical auth metadata in that flow. After email verification, `/auth/callback` receives a valid session but `app_metadata.organization_id` and `app_metadata.role` are missing, which blocks post-login routing and onboarding.

## Scope

### Included

- Update `src/app/auth/callback/route.ts` to detect first-time verified signup callbacks.
- Use `getRuntimeDataAccess()` server-side to create:
  - organization via `organizations.create({ name })`
  - employee via `employees.create({ id, organizationId, email, name, active: true })`
- Generate employee ID as `EMP-` + 12 uppercase hex characters.
- Use Supabase admin API (`createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`) to set canonical `app_metadata`:
  - `role: "admin"`
  - `organization_id`
  - `actor_id`
- Redirect first-time callback success to `/onboarding`.
- Redirect to `/login?error=auth_callback_setup_failed` if callback provisioning fails.

### Excluded

- No schema/migration changes.
- No changes to `contracts/contract.yaml` or `contracts/api.yaml`.

## Implementation Summary

- Added first-time callback detection condition:
  - `user_metadata.organization_name` exists
  - `app_metadata.organization_id` is missing
- Added a server-only provisioning function in callback route to create org/employee and update user `app_metadata` via service role client.
- Added session refresh attempt after metadata update so callback cookie can carry refreshed claims when available.
- Preserved existing callback behavior for non-first-time paths.

## Validation

- `npm run typecheck`
- `npm run lint`

## Rollback Plan

- Revert `src/app/auth/callback/route.ts`.
- Re-run lint/typecheck.
