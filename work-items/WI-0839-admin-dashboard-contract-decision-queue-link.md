# WI-0839 Admin Dashboard Contract Decision Queue Link

## Summary
- Added contract decision queue shortcut to admin dashboard communication hub.
- Extended ko/en workspace-hub labels so admins can jump directly to decision backlog.
- Added regression test to lock decision-queue deeplink exposure in the dashboard hub.

## Scope
- `src/app/admin/page-workspace-hubs.ts`
- `scripts/tests/e2e-wi0839-admin-dashboard-contract-decision-queue-link.test.ts` (new)

## Acceptance
1. `/admin` communication hub includes `/admin/contracts?decisionQueueOnly=true` link.
2. Both ko/en labels are exposed for the decision queue shortcut.
3. Existing SLA overdue and pending response links remain intact.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0839-admin-dashboard-contract-decision-queue-link.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0836-admin-dashboard-contract-risk-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
