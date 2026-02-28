# WI-0681 Scheduling Anomaly Side-Effect Context Builder Adoption

## Summary
- added `buildScheduleAnomalySideEffectContext` to
  `src/features/scheduling/anomaly-side-effect-helpers.ts`.
- replaced duplicated inline side-effect context object assembly in
  `src/features/scheduling/service.ts` with the shared builder across:
  - anomaly report alert/escalation flow
  - anomaly cockpit ticket-automation flow
- preserved side-effect publish/audit behavior.
- added WI-0681 regression guard for builder adoption and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0681-scheduling-anomaly-side-effect-context-builder-adoption.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0051-scheduling-anomaly-alert-automation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0065-scheduling-anomaly-cockpit-dashboard.test.ts`
- `npm.cmd run typecheck`
