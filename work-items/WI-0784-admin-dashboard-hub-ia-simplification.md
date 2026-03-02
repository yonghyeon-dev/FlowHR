# WI-0784 Admin Dashboard Hub IA Simplification

## Summary
- simplified `/admin` information architecture into a fixed summary hub pattern.
- added "today's top priority" panel based on existing focus-card severity ordering.
- replaced mixed-purpose dashboard sections with "core workspace hub" cards:
  - approvals
  - people/onboarding
  - scheduling/leave
  - payroll/year-end
  - notices/benefits/recruitment
- removed header login shortcut to keep admin dashboard focused on operator workflow.

## Scope
- core admin UX information architecture simplification only
- no scheduler/ops expansion
- no phase-style layering

## Data Changes
- none

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0665-admin-dashboard-priority-focus-cards-ux.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0781-admin-dashboard-korean-runtime-copy-normalization.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0784-admin-dashboard-hub-ia-simplification.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- `python scripts/ci/check_contracts.py`
- `python scripts/ci/check_traceability.py`
