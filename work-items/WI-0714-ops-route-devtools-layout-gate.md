# WI-0714 Ops Route Devtools Layout Gate

## Summary
- added shared `src/app/ops/layout.tsx` guard so `/ops/*` routes are accessible only
  when `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` is enabled.
- when devtools flag is disabled, `/ops/*` now returns `notFound()` to keep ops
  surfaces out of product mode.

## Scope
- route-level productization gate only
- no API/schema/contract change
- no scheduler/ops expansion

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0714-ops-route-devtools-layout-gate.test.ts`
- `npm.cmd run typecheck`
