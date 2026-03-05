# WI-0969: Admin session flickering on initial load

## Background

In `src/app/admin/page.tsx`, `useSupabaseSession()` resolves asynchronously and starts with a `null` session snapshot.
During that initial frame, `bearerToken` is empty, so production-only `requiresLoginSession` can evaluate to `true` before session loading finishes.
That briefly renders the login-required notice and then switches to dashboard content, causing a visible flicker.

## Scope

### Included

- Add `loading` state to `useSupabaseSession` so consumers can distinguish "session not loaded yet" from "no session".
- Update `src/app/admin/page.tsx` so login-required gating is deferred while session loading is in progress.
- Skip dashboard refresh API calls while session loading is in progress.
- Update `src/components/SessionMenu.tsx` to avoid showing login-required copy during session bootstrap.
- Add regression test: `scripts/tests/e2e-wi0969-admin-session-flickering.test.ts`.

### Excluded

- API contract changes (`specs/contract.yaml`, `specs/api.yaml`)
- Database schema or migration updates

## Implementation Notes

- `SupabaseSessionState` now exposes `loading: boolean`.
- `loading` defaults to `true` and flips to `false` after initial `getSession()` resolution (success or failure).
- Admin dashboard computes `requiresLoginSession` only after session loading completes.

## Tests

- `node --experimental-strip-types scripts/tests/e2e-wi0969-admin-session-flickering.test.ts`

## ADR

- Not required: this is a UI session-bootstrap behavior fix with no cross-domain contract, security boundary, or architecture-level change.
