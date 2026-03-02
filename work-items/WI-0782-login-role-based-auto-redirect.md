# WI-0782 Login Role-Based Auto Redirect

## Summary
- added role-based auto redirect on `/login` when an active Supabase session exists.
- after session detection:
  - admin/payroll_operator/manager -> `/admin`
  - others -> `/employee`
- added runtime message to explain automatic redirect behavior in ko/en.

## Scope
- core authentication UX enhancement only
- no scheduler/ops expansion
- no phase-style layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0782-login-role-based-auto-redirect.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
