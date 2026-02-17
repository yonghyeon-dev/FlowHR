# WI-0077: Scheduling Anomaly Incident Escalation Automation API

## Background and Problem

WI-0076 provides SLA status visibility, but operators still trigger escalation workflows manually.
We need a command API that converts SLA-breached incidents into workflow integration events with cooldown control.

## Scope

### In Scope

- Add command endpoint:
  - `POST /scheduling/anomalies/incidents/escalate`
- Escalation candidate selection based on incident SLA result and policy.
- Publish incident-level escalation request event for workflow integration.
- Enforce cooldown to prevent duplicate escalation requests.
- Keep endpoint non-blocking with partial failure reporting.

### Out of Scope

- External ticket/pager connector implementation
- Persistent incident state machine table migration
- Payroll enforcement or automatic attendance mutation

## User Scenarios

1. Manager triggers escalation command and receives requested/skipped/failed summary.
2. Breached incidents publish workflow request events when cooldown permits.
3. Repeated command within cooldown skips duplicate incident escalation requests.
4. Employee role is denied from escalation command endpoint.

## Data Changes (Tables and Migrations)

- No schema migration.
- Projection/read source table: `AuditLog`.

## API/Event Changes

- API:
  - `POST /scheduling/anomalies/incidents/escalate`
- Domain events:
  - `scheduling.anomaly.incident.escalation.requested.v1`
- Audit:
  - `scheduling.anomaly.incident.escalation.generated`
  - `scheduling.anomaly.incident.escalation.requested`
  - `scheduling.anomaly.incident.escalation.request.failed`

## Test Plan

- `npm run typecheck`
- `npm run lint`
- `npx tsx scripts/tests/e2e-wi0077-scheduling-anomaly-incident-escalation-automation.test.ts`

## Observability

- Escalation command summary includes:
  - policy (`slaTargetMinutes`, `warningMinutes`, `includeWarning`, `cooldownMinutes`, `dryRun`)
  - candidate counts (`requested`, `skippedCooldown`, `failed`)
  - workflow routing metadata (`escalationChannel`)

## Rollback Plan

- Revert WI-0077 commit and disable route `/scheduling/anomalies/incidents/escalate`.
- No DB rollback required.
