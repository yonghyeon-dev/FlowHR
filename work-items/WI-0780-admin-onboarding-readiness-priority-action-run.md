# WI-0780 Admin Onboarding Readiness Priority Action Run

## Summary
- upgraded `/admin/onboarding` readiness panel so the highest-priority pending checklist item can be executed directly.
- wired the readiness priority action button to onboarding setup APIs:
  - departments: apply department seed
  - employees: apply employee seed
  - invites: issue pending invites
  - leave policy: apply defaults
  - contracts: execute next unresolved contract step (template bootstrap, draft creation, approval request, approval decision, send, or pending-response queue follow-up)
- kept workspace link for manual follow-up and disabled execution while a request is pending.

## Scope
- core onboarding journey UX enhancement only
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
- `npm.cmd exec tsx scripts/tests/e2e-wi0778-admin-onboarding-readiness-summary.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0779-admin-onboarding-readiness-priority-action.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0780-admin-onboarding-readiness-priority-action-run.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0699-admin-core-context-session-identity-devtools-gate.test.ts`
- `npm.cmd run typecheck`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
