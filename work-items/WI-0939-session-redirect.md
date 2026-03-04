# WI-0939: Session Expiry Redirect Middleware

## Background and Problem

When a user session expires, protected workspace routes and client-side API calls can return unauthenticated responses.
The app must consistently redirect users to `/login` and preserve the original destination for post-login recovery.

## Scope

### In Scope

- Add Next.js middleware guard for protected routes:
  - `/employee/*`
  - `/admin/*`
  - `/ops/*`
- Define public pass-through routes:
  - `/login`
  - `/signup`
  - `/reset-password`
  - `/api/*`
  - `/_next/*`
  - `/favicon.ico`
- Redirect unauthenticated protected requests to:
  - `/login?redirect=<original-path-and-query>`
- Align client API wrapper behavior:
  - on HTTP `401`, redirect browser to `/login?redirect=<current-path-and-query>`
- Keep login success flow using `redirect` query parameter.

### Out of Scope

- Server-side API authorization policy changes.
- Supabase role/metadata enrichment behavior.
- User-facing redesign of login UI.

## API and Route Behavior Changes

- Middleware route handling now applies cookie-based auth check for protected pages and pass-through for public routes.
- Client API utility now performs 401 interception and login redirect.

## Test Plan

- `scripts/tests/e2e-wi0939-session-redirect.test.ts`
  - `/employee` without session cookie returns `307` redirect to `/login`
  - redirect includes `redirect` query with original path and query string
  - `/login` without session returns pass-through (`200`)
  - `/api/*` without session returns pass-through (`200`)

## Rollback Plan

- Revert middleware route guard updates in `src/middleware.ts`.
- Revert 401 redirect interception changes in `src/lib/api-client.ts`.
- Remove `scripts/tests/e2e-wi0939-session-redirect.test.ts`.
- Remove this work item document.
