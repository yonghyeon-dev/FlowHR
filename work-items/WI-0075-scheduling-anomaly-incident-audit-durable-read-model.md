# WI-0075: Scheduling Anomaly Incident Audit-Backed Durable Read-Model

## Background and Problem

WI-0072/0073 incident lifecycle API used process-local in-memory map for read-model projection.
This causes lifecycle state loss on process restart and weakens operational durability.

## Scope

### In Scope

- Replace in-memory incident read-model source with audit-log-backed projection.
- Keep existing incident lifecycle command/list/detail API contracts unchanged.
- Keep tenant isolation and role checks for incident command/read endpoints.
- Add audit query capability to shared `DataAccess` abstraction (`memory` and `prisma`).

### Out of Scope

- New incident table migration
- Incident SLA engine / escalation scheduler
- API shape changes for incident endpoints

## User Scenarios

1. Manager executes `ack -> assign -> resolve` commands and sees consistent incident state/history from read-model APIs.
2. Incident list/detail reads are reconstructed from persisted audit entries, not process-local cache.
3. Cross-tenant incident detail access still returns `404`.

## Data Changes (Tables and Migrations)

- No schema migration
- Runtime projection source:
  - `AuditLog` (incident lifecycle actions: scheduling.anomaly.incident.acknowledged / assigned / resolved)

## API/Event Changes

- API endpoints: unchanged
  - `POST /scheduling/anomalies/incidents/{incidentId}/ack`
  - `POST /scheduling/anomalies/incidents/{incidentId}/assign`
  - `POST /scheduling/anomalies/incidents/{incidentId}/resolve`
  - `GET /scheduling/anomalies/incidents`
  - `GET /scheduling/anomalies/incidents/{incidentId}`
- Domain events: unchanged
  - `scheduling.anomaly.incident.updated.v1`

## Test Plan

- `npm run typecheck`
- `npm run lint`
- `npx tsx scripts/tests/e2e-wi0072-scheduling-anomaly-incident-lifecycle.test.ts`
- `npx tsx scripts/tests/e2e-wi0073-scheduling-anomaly-incident-read-model.test.ts`

## Observability

- Existing audit actions remain SSoT for lifecycle projection:
  - `scheduling.anomaly.incident.acknowledged`
  - `scheduling.anomaly.incident.assigned`
  - `scheduling.anomaly.incident.resolved`
  - `scheduling.anomaly.incident.listed`
  - `scheduling.anomaly.incident.read`

## Rollback Plan

- Revert WI-0075 commit to restore previous in-memory projection behavior.
- No DB rollback required.
