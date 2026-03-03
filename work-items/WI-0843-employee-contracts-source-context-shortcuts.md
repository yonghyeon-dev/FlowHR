# WI-0843 Employee Contracts Source-Context Shortcuts

## Summary
- Added `source=employee-dashboard` context to employee dashboard contract shortcut links.
- Applied source context to base contracts entry, action-needed, due-soon, and overdue shortcut routes.
- Added regression guard so dashboard contract deep links keep source context wiring.

## Scope
- `src/components/employee-dashboard/workspace-hubs.ts`
- `scripts/tests/e2e-wi0843-employee-contracts-source-context-shortcuts.test.ts` (new)

## Acceptance
1. Employee dashboard contract shortcuts include `source=employee-dashboard`.
2. Existing pending-response and deadline filters remain intact.
3. ko/en dashboard hubs both preserve source-context links.

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0843-employee-contracts-source-context-shortcuts.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0840-employee-dashboard-contract-action-needed-shortcut.test.ts`
- `python scripts/ci/check_traceability.py`
- `npm.cmd run build`
