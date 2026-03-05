# WI-0946: Fix Email Verification Redirect to Production Callback

## Background and Problem

Supabase email confirmation links were redirecting to localhost in production signup flows because:
- `signUp()` did not set `emailRedirectTo`
- `/auth/callback` route for auth code exchange was missing

Without callback handling, confirmation links could not reliably establish a valid session/redirect path in production.

## Scope

### In Scope

- Update `src/app/(auth)/signup/page.tsx`:
  - set `options.emailRedirectTo` to `${window.location.origin}/auth/callback`
- Add `src/app/auth/callback/route.ts`:
  - read `code` query param
  - exchange code via Supabase `exchangeCodeForSession(code)`
  - success redirect:
    - `/onboarding` for admin users not fully onboarded
    - `/employee` for already onboarded users
  - failure redirect:
    - `/login?error=auth_callback_failed`
  - no-code redirect:
    - `/login`
- Keep forgot-password redirect behavior (`window.location.origin`) unchanged and verify it remains correct.
- Add callback route note for Supabase Redirect URLs allow-list in production.

### Out of Scope

- Changes to login page UX/copy
- Auth provider changes beyond email verification callback flow
- Supabase dashboard configuration itself (documented as operational note only)

## Operational Notes

- Supabase Dashboard must include production callback URL in Redirect URLs allow-list:
  - `https://<production-domain>/auth/callback`
- Callback route also syncs FlowHR access token cookie used by middleware-protected routes.

## Test Plan

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- Manual smoke:
  - Signup with a new email
  - Click verification link from email
  - Confirm redirect lands on `/onboarding` or `/employee` as expected
  - Confirm forgot-password email still links to `${origin}/reset-password`

## Rollback Plan

- Revert WI-0946 commit to remove callback route and signup redirect option.
- Restore previous signup behavior if callback flow causes regression.
