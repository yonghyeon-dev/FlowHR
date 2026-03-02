# WI-0770 Admin Onboarding Contract Template Bootstrap

## Summary
- added onboarding contract-template bootstrap step in `/admin/onboarding` setup panels.
- wired onboarding setup load to include active employment contract template count from `/api/contracts/templates`.
- added one-click bootstrap action:
  - creates an ACTIVE default employment contract template when none exists.
  - disables bootstrap button once an active employment template is already present.
- surfaced onboarding readiness copy for template-required/template-ready states.

## Scope
- core onboarding journey enhancement only
- no ops/scheduler expansion
- no phase-style UI layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0770-admin-onboarding-contract-template-bootstrap.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0237-admin-onboarding-wizard-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
