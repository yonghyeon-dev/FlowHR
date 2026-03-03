# WI-0838 Admin Dashboard Workspace Hub Korean Copy Recovery

## Summary
- Recovered corrupted Korean copy in admin dashboard workspace hub blocks.
- Restored readable labels for approvals, people, scheduling, payroll, and communication hubs.
- Added regression guard to block mojibake regression on admin workspace hub copy.

## Scope
- `src/app/admin/page-workspace-hubs.ts`
- `scripts/tests/e2e-wi0838-admin-dashboard-workspace-hub-korean-copy-recovery.test.ts` (new)

## Acceptance
1. `/admin` workspace hubs render readable Korean labels in ko locale.
2. Contract risk shortcuts in communication hub remain available.
3. Regression guard fails if corrupted replacement character appears again.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0838-admin-dashboard-workspace-hub-korean-copy-recovery.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0836-admin-dashboard-contract-risk-links.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
