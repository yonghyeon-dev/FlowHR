# WI-0840 Employee Dashboard Contract Action Needed Shortcut

## Summary
- Added contract action-needed shortcut to employee dashboard document hub.
- Exposed `/employee/contracts?status=pending_response` quick jump in ko/en labels.
- Added regression guard to keep the action-needed shortcut visible in workspace hubs.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `scripts/tests/e2e-wi0840-employee-dashboard-contract-action-needed-shortcut.test.ts` (new)

## Acceptance
1. Employee dashboard document hub exposes `pending_response` contract queue shortcut.
2. Existing due-soon and overdue contract shortcuts remain intact.
3. ko/en labels are available for the new shortcut.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0840-employee-dashboard-contract-action-needed-shortcut.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0835-employee-dashboard-contract-risk-shortcuts.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
