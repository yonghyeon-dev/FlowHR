# WI-0612: Scheduling service incident query helper extraction

## Background

`src/features/scheduling/service.ts` still contained inline anomaly incident query
orchestration for list/read flows. This repeated actor/permission/tenant/audit logic and
kept the service monolith larger than necessary.

## Scope

- Add `src/features/scheduling/anomaly-incident-query-service-helpers.ts`
  - `listScheduleAnomalyIncidentsFromHelper`
  - `getScheduleAnomalyIncidentFromHelper`
- Move list/read query orchestration from `service.ts` into helper.
- Keep behavior parity (permission/tenant guards, audit payload fields, response shape).
- Rewire `service.ts` exported functions to delegate to helper.
- Add WI-0612 regression guard and roadmap entry.

## Out of Scope

- Incident SLA/escalation/archive/replay/reconcile logic changes
- API schema/contract changes

## Acceptance Criteria

1. `listScheduleAnomalyIncidents` delegates to helper and keeps deterministic payload/audit behavior.
2. `getScheduleAnomalyIncident` delegates to helper and keeps deterministic payload/audit behavior.
3. `service.ts` line budget remains reduced after extraction.
4. Existing scheduling anomaly query behavior remains backward compatible.

## Validation

- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0612-scheduling-service-incident-query-helper-extraction.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0598-scheduling-service-split-phase2.test.ts`
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run lint`
