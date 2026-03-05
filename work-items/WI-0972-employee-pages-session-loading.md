# WI-0972: Prevent session loading flicker on remaining client pages

## Background and Problem

WI-0969 and WI-0971 aligned session-loading behavior for admin surfaces by deferring production login gating until `useSupabaseSession()` finishes loading.
Several remaining client-facing pages still evaluate production session guards before bootstrap settles, which can cause brief login-required flicker or premature API-side effects.

## Scope

### In Scope

- Add `loading` session-state handling to the remaining employee/client pages called out in this WI.
- Gate `requiresLoginSession` with session loading state on each target page.
- Guard page-level `useEffect` API entry points while session loading is in progress.
- Extend regression coverage with a dedicated WI-0972 static e2e guard test.

### Out of Scope

- API contracts, schema, or migration changes.
- Non-targeted route behavior outside the listed files.

## Test Plan

- `npm run typecheck`
- `node --experimental-strip-types scripts/tests/e2e-wi0972-employee-pages-session-loading.test.ts`

## ADR

- Not required: this is a focused session-bootstrap guard consistency update across existing client pages.
