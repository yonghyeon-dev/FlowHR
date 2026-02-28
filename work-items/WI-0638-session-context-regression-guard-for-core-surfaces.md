# WI-0638 Session-Context Regression Guard for Core Surfaces

## Summary
- added regression guard test to block manual context-input reintroduction on core surfaces
- guard checks key admin/employee pages and major workspace consoles for legacy patterns:
  - `onOrganizationIdChange`
  - `onAccessTokenChange`
  - `Bearer access token (override)`
  - `Organization ID (optional)`
- scope intentionally excludes `/ops/*` tools

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0638-session-context-regression-guard-for-core-surfaces.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
