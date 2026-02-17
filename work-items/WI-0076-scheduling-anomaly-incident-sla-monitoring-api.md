# WI-0076: Scheduling Anomaly Incident SLA Monitoring API

## Background and Problem

WI-0075 made anomaly incident read-model durable by reconstructing from audit logs.
Operations still lack a direct SLA view to identify at-risk incidents before escalation delay.

## Scope

### In Scope

- Add read-only incident SLA monitoring endpoint:
  - `GET /scheduling/anomalies/incidents/sla`
- Compute SLA status (`HEALTHY`, `WARNING`, `BREACHED`, `RESOLVED`) from incident lifecycle projection.
- Support query-level policy tuning (`slaTargetMinutes`, `warningMinutes`, `includeResolved`, `asOf`) with tenant scope and RBAC.
- Append audit trace for SLA query action.

### Out of Scope

- Automated incident re-routing or ticket orchestration
- Pager/notification fanout changes
- New persistence table or migration

## User Scenarios

1. Manager opens incident SLA endpoint and sees breached/warning incidents prioritized for triage.
2. Manager can include resolved incidents for retrospective review.
3. Employee role is denied from incident SLA endpoint.
4. Cross-tenant manager can only see own tenant incidents.

## Data Changes (Tables and Migrations)

- No schema migration.
- Read projection source table: `AuditLog`.

## API/Event Changes

- API:
  - `GET /scheduling/anomalies/incidents/sla`
- Domain events:
  - none (read-only endpoint)
- Audit:
  - `scheduling.anomaly.incident.sla.generated`

## Test Plan

- `npm run typecheck`
- `npm run lint`
- `npx tsx scripts/tests/e2e-wi0076-scheduling-anomaly-incident-sla-monitoring.test.ts`

## Observability

- SLA query audit includes:
  - policy (`slaTargetMinutes`, `warningMinutes`, `includeResolved`, `asOf`)
  - filters (`state`, `assigneeId`, `topN`)
  - counts (`total`, `open`, `warning`, `breached`, `resolved`)

## Rollback Plan

- Revert WI-0076 commit and hide `/scheduling/anomalies/incidents/sla` route.
- No DB rollback required.
