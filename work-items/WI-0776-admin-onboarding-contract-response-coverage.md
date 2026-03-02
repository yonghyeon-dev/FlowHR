# WI-0776 Admin Onboarding Contract Response Coverage

## Summary
- extended `/admin/onboarding` contract section with employee response coverage metrics after contract send.
- onboarding setup now derives response-ready/pending coverage from employment contract document statuses.
- added quick action for pending response follow-up:
  - opens `/admin/contracts` with `status=SENT` filter,
  - helps admins handle pending employee contract responses without exposing ops/devtools surfaces.

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
- `npm.cmd exec tsx scripts/tests/e2e-wi0773-admin-onboarding-contract-approval-request-coverage.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0774-admin-onboarding-contract-send-coverage.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0775-admin-onboarding-contract-send-execution-coverage.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0776-admin-onboarding-contract-response-coverage.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
