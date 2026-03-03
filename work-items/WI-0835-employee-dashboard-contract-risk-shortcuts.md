# WI-0835 Employee Dashboard Contract Risk Shortcuts

## Summary
- Added contract risk shortcuts to employee dashboard workspace hub.
- Added due-soon and overdue deeplink CTAs to `/employee/contracts`.
- Extended both ko/en workspace hub links to include contract triage entry points.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `scripts/tests/e2e-wi0835-employee-dashboard-contract-risk-shortcuts.test.ts` (new)

## Acceptance
1. Employee dashboard documents hub includes deep links to contract due-soon and overdue queues.
2. Contract risk shortcuts are available in both ko/en locales.
3. Existing contracts/notices/benefits/recruitment links remain available.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0835-employee-dashboard-contract-risk-shortcuts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0834-employee-contracts-deeplink-filter-hydration.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
