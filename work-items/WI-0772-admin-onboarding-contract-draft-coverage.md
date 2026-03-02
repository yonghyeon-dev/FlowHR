# WI-0772 Admin Onboarding Contract Draft Coverage

## Summary
- extended `/admin/onboarding` contract setup panel with contract-draft coverage metrics.
- onboarding setup now loads contract documents for the active employment template and computes:
  - prepared contract-draft employees,
  - pending contract-draft employees.
- added one-click pending draft generation:
  - creates `DRAFT` employment contract documents for employees missing template-linked drafts.
  - skips employees who already have active lifecycle documents (`DRAFT`, `APPROVAL_REQUESTED`, `SENT`, `SIGNED`, `RENEWED`).

## Scope
- core onboarding journey enhancement only
- no scheduler/ops expansion
- no phase-style layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0237-admin-onboarding-wizard-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0771-admin-onboarding-employee-invite-coverage.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0772-admin-onboarding-contract-draft-coverage.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
