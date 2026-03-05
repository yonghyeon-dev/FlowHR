# WI-0971: Prevent session flicker across admin sub-pages

## Background and Problem

WI-0969 fixed `src/app/admin/page.tsx` by deferring production login gating until `useSupabaseSession()` finishes loading.
Other admin sub-pages that still consume `useSupabaseSession()` can evaluate login gating before session bootstrap completes.
That can briefly show login-required state and allow early action attempts before session state is settled.

## Scope

### In Scope

- Apply the WI-0969 session-loading guard pattern to admin sub-pages using `useSupabaseSession()` (excluding `src/app/admin/page.tsx`).
- Destructure `loading` as `supabaseSessionLoading` in each target page.
- Defer `requiresLoginSession` evaluation until session loading completes.
- Delay page-level API action entry points while session loading is in progress.
- Add regression test coverage for target pages.

### Out of Scope

- `src/app/admin/page.tsx` changes (already handled in WI-0969).
- API contract/schema/migration changes.
- Non-admin routes.

## Test Plan

- `node --experimental-strip-types scripts/tests/e2e-wi0971-admin-pages-session-loading.test.ts`

## ADR

- Not required: this is a scoped session-bootstrap guard alignment for existing admin UI flows without cross-domain architecture impact.
