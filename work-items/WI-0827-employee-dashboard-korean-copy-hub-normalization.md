# WI-0827 Employee Dashboard Korean Copy and Hub Normalization

## Summary
- Normalized corrupted Korean copy in employee dashboard account overview panels.
- Normalized corrupted Korean copy in employee workspace hub card map.
- Added actionable hub deep links for pending benefits queue and stalled recruitment queue to improve direct triage flow.

## Scope
- `src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx`
- `src/components/employee-dashboard/workspace-hubs.ts`
- `scripts/tests/e2e-wi0827-employee-dashboard-korean-copy-hub-normalization.test.ts` (new)

## Acceptance
1. Employee dashboard Korean copy renders with readable labels/messages in workspace hub, priority action, and account panels.
2. Employee workspace hub includes direct links to pending benefits queue and stalled recruitment queue.
3. Employee account overview panel stays under line budget (`<= 360`).

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0827-employee-dashboard-korean-copy-hub-normalization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0785-employee-dashboard-hub-ia-simplification.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0805-employee-dashboard-action-priority-badges.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
