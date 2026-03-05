# WI-0973: Admin dashboard session-loading render guard

## Background and Problem

`src/app/admin/page.tsx` already reads `loading` from `useSupabaseSession()` as `supabaseSessionLoading`.
However, the page still renders while session bootstrap is in progress because there is no early return before JSX output.
This causes an initial UI flicker before authenticated session state settles.

## Scope

### In Scope

- Add an early render guard in `src/app/admin/page.tsx`.
- Return `null` while `supabaseSessionLoading === true`.
- Add regression test coverage that validates the guard exists.

### Out of Scope

- API contracts, schema, and migration changes.
- Admin sub-pages already handled by WI-0971.
- Employee pages handled by WI-0972.

## Test Plan

- `node --experimental-strip-types scripts/tests/e2e-wi0973-admin-page-session-guard.test.ts`
- `npm run typecheck`

## ADR

- Not required: this is a narrow UI render-timing fix for an existing session bootstrap path.
