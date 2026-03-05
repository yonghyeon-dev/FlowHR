# WI-0974: Admin sub-pages session loading guard expansion

## Background and Problem

WI-0971 and WI-0973 aligned session bootstrap behavior for major admin surfaces, but several admin and employee sub-page entry routes still rendered immediately while `useSupabaseSession()` was loading.
Those routes could briefly mount downstream workspaces before session bootstrap settled, causing visible flicker and inconsistent initial behavior.

## Scope

### In Scope

- Add `useSupabaseSession()` loading destructuring on the listed admin/employee sub-page route files.
- Add an early render guard (`if (loading) return null;`) immediately before page JSX return.
- Keep each route’s existing rendered workspace/component behavior unchanged after loading settles.
- Add static regression coverage for all 21 target files.

### Out of Scope

- API contracts, schema, and migration changes.
- Dashboard page (`src/app/admin/page.tsx`) changes from WI-0973.
- Non-target routes.

## Test Plan

- `node --experimental-strip-types scripts/tests/e2e-wi0974-admin-subpages-session-guard.test.ts`
- `npm run typecheck`

## ADR

- Not required: this is a scoped render-timing guard consistency update without architectural impact.
