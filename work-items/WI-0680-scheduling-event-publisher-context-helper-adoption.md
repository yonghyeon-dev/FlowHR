# WI-0680 Scheduling Event-Publisher Context Helper Adoption

## Summary
- replaced local scheduling service event-publisher resolver with shared context helper:
  - `resolveSchedulingEventPublisher` from
    `src/features/scheduling/anomaly-service-context-helpers.ts`
- removed duplicated `getEventPublisher` implementation from
  `src/features/scheduling/service.ts`.
- rewired scheduling domain-event publish call-sites to shared resolver.
- added WI-0680 regression guard for helper adoption and line budget.

## Scope
- scheduling service internal refactor only
- no API/schema/contract changes
- no UX changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0680-scheduling-event-publisher-context-helper-adoption.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0068-scheduling-anomaly-cockpit-streaming-dashboard.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0051-scheduling-anomaly-alert-automation.test.ts`
- `npm.cmd run typecheck`
