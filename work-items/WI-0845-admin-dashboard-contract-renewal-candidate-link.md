# WI-0845 Admin Dashboard Contract Renewal Candidate Link

## Summary
- Added contract renewal-candidate shortcut to admin dashboard communication hub.
- Extended ko/en communication hub link labels for renewal follow-up queue.
- Added regression guard to keep renewal-candidate deeplink exposure on `/admin`.

## Scope
- `src/app/admin/page-workspace-hubs.ts`
- `scripts/tests/e2e-wi0845-admin-dashboard-contract-renewal-candidate-link.test.ts` (new)

## Acceptance
1. `/admin` communication hub includes `/admin/contracts?renewalCandidateOnly=true` link.
2. ko/en labels are available for renewal-candidate shortcut.
3. Existing contract decision/SLA/pending-response links remain intact.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0845-admin-dashboard-contract-renewal-candidate-link.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0839-admin-dashboard-contract-decision-queue-link.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
