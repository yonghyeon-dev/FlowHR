# WI-0687 Scheduling Write-Actor Context Helper Adoption

## Summary
- added `resolveSchedulingWriteActorContext` to
  `src/features/scheduling/anomaly-service-context-helpers.ts`.
- rewired scheduling anomaly write flows in `src/features/scheduling/service.ts`
  to use the shared helper instead of repeating:
  - `requireSchedulingWriteActor(...)`
  - `resolveSchedulingTenantScope(actor)`
- preserved permission and tenant-scope semantics.
- added WI-0687 regression guard for helper adoption and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0687-scheduling-write-actor-context-helper-adoption.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0072-scheduling-anomaly-incident-lifecycle.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0065-scheduling-anomaly-cockpit-dashboard.test.ts`
- `npm.cmd run typecheck`
