# WI-0771 Admin Onboarding Employee Invite Coverage

## Summary
- added employee invite coverage step to `/admin/onboarding` so onboarding progress reflects whether employee invites were issued.
- added `GET /api/auth/invites` query endpoint backed by audit logs for organization-scoped invite history.
- updated onboarding setup data flow to:
  - load invite history (`/api/auth/invites?role=employee`),
  - compute invite eligible/sent/pending coverage,
  - issue pending employee invites in one click via `POST /api/auth/invites`.
- expanded onboarding checklist from 4 to 5 items by adding `invites` completion state.

## Scope
- core onboarding journey enhancement only
- no scheduler/ops expansion
- no phase-style layering

## Data Changes
- none (audit-log read model reuse)

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0237-admin-onboarding-wizard-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0771-admin-onboarding-employee-invite-coverage.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
