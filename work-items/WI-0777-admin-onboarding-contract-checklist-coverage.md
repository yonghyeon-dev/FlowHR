# WI-0777 Admin Onboarding Contract Checklist Coverage

## Summary
- connected onboarding checklist/progress to contract execution journey completion.
- added `contracts` checklist item that is marked done only when contract pipeline is fully covered:
  - draft coverage complete,
  - approval request coverage complete,
  - approval decision coverage complete,
  - send coverage complete,
  - response coverage complete.
- updated `/admin/onboarding` checklist labels (ko/en) to expose contract onboarding completion state.

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
- `npm.cmd exec tsx scripts/tests/e2e-wi0777-admin-onboarding-contract-checklist-coverage.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
