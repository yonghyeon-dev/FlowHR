# WI-0971: Admin sub-pages session loading guard

## Background

After WI-0969, `src/app/admin/page.tsx` defers production login gating until `useSupabaseSession()` loading completes.
Several admin sub-pages still evaluated login-required state before session bootstrap finished, which could briefly show login-required UI and trigger early API paths.

## Scope

### Included

- Update these pages to read `loading` from `useSupabaseSession()`:
  - `src/app/admin/approval-executions/page.tsx`
  - `src/app/admin/approval-history/page.tsx`
  - `src/app/admin/approval-policy/page.tsx`
  - `src/app/admin/approval-templates/page.tsx`
  - `src/app/admin/people/page.tsx`
- Defer `requiresLoginSession` evaluation until loading completes (`!loading && ...`).
- Delay API entry paths while session loading is `true`.
- Prevent session-loading-time login-required flicker in affected page UI controls.

### Excluded

- API contract changes (`specs/contract.yaml`, `specs/api.yaml`)
- Database schema or migration updates
- Admin root dashboard (`src/app/admin/page.tsx`)

## Implementation Notes

- Applied WI-0969 session-loading guard pattern to all targeted admin sub-pages.
- Added loading-aware guards to manual action handlers so API calls do not start during session bootstrap.
- Kept existing runtime/devtools behavior intact, only adding loading deferral.

## Tests

- `npm run typecheck`

## ADR

- Not required: this is a UI/session bootstrap timing fix with no architecture or domain boundary change.
