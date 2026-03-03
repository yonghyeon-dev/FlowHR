# WI-0869 Employee Session Auto-Load Snapshot

## Summary
- Added one-shot session-ready snapshot auto-load in `/employee` so attendance/leave/schedule data appears without manual refresh on first entry.
- Kept production guard behavior: when bearer session is missing in production runtime, auto-load does not run.
- Added stable auto-load key guard to prevent duplicate auto-refresh loops across re-renders.

## Scope
- `src/app/employee/page.tsx`
- `scripts/tests/e2e-wi0869-employee-session-autoload-snapshot.test.ts` (new)

## Acceptance
1. `/employee` auto-loads `mutationActions.refreshEmployeeSnapshot()` once when session context is ready.
2. Auto-load is skipped in production runtime when bearer token is unavailable.
3. Re-renders do not trigger duplicate snapshot fetches for the same runtime session mode.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0869-employee-session-autoload-snapshot.test.ts`
- `npm.cmd run build`
