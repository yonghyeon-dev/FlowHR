# WI-0844 Employee Contracts Source Entry Banner

## Summary
- Added source-entry hint banner to `/employee/contracts` when opened from dashboard shortcuts.
- Shows localized ko/en hint copy for dashboard-originated contract queue entry.
- Added regression guard and preserved inbox line-budget constraints.

## Scope
- `src/components/contracts/EmployeeContractsInbox.tsx`
- `scripts/tests/e2e-wi0844-employee-contracts-source-entry-banner.test.ts` (new)

## Acceptance
1. `/employee/contracts?source=employee-dashboard` shows source-entry hint banner.
2. No banner is shown when source query is absent.
3. Employee contracts inbox remains within line-budget guard.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0844-employee-contracts-source-entry-banner.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0834-employee-contracts-deeplink-filter-hydration.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0347-bloat-guard-hardening.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
