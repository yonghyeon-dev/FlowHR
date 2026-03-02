# WI-0774 Admin Onboarding Contract Approval Decision Coverage

## Summary
- extended `/admin/onboarding` contract section with approval-decision coverage metrics.
- onboarding setup now derives decision-ready/pending coverage from employment contract documents.
- added one-click pending approval decision action:
  - targets pending `APPROVAL_REQUESTED` onboarding contract documents,
  - calls `POST /api/contracts/documents/{documentId}/approval` with `action=APPROVE`,
  - refreshes coverage after execution.

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
- `npm.cmd exec tsx scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
