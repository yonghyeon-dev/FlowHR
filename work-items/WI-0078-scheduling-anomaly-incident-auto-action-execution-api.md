# WI-0078: Scheduling Anomaly Incident Auto-Action Execution API

## Background and Problem

WI-0077 can request escalation workflows from SLA candidates, but operators still need a follow-up step to assign incident owners consistently.
Without one command that orchestrates escalation + assignment + ops notification, on-call execution remains manual and inconsistent.

## Scope

### In Scope

- Add command endpoint:
  - `POST /scheduling/anomalies/incidents/auto-actions`
- Orchestrate escalation candidate evaluation through existing SLA/escalation policy path.
- Execute lifecycle `ASSIGN` action automatically for matched incidents based on `autoAssignMode`.
- Support dry-run execution that returns deterministic plan without lifecycle writes.
- Publish ops notification summary event for executed auto-actions.

### Out of Scope

- External pager/ticket provider implementation
- New incident persistence table migration
- Automatic incident `RESOLVE` mutation

## User Scenarios

1. Manager runs one command and gets escalation + assignment summary in one response.
2. Existing assignee ownership is preserved when `autoAssignMode=ASSIGN_IF_UNASSIGNED`.
3. Dry-run mode returns action plan without updating incident assignee.
4. Employee role is denied from auto-action endpoint.

## Data Changes (Tables and Migrations)

- No schema migration.
- Runtime projection source remains `AuditLog`.

## API/Event Changes

- API:
  - `POST /scheduling/anomalies/incidents/auto-actions`
- Domain events:
  - `scheduling.anomaly.incident.auto_action.executed.v1`
- Audit:
  - `scheduling.anomaly.incident.auto_action.generated`
  - `scheduling.anomaly.incident.auto_action.notified`
  - `scheduling.anomaly.incident.auto_action.notify.failed`
  - `scheduling.anomaly.incident.auto_action.assign.failed`

## Test Plan

- `npm run typecheck`
- `npm run lint`
- `npx tsx scripts/tests/e2e-wi0078-scheduling-anomaly-incident-auto-action-execution.test.ts`

## Observability

- Auto-action command summary includes:
  - escalation policy (`slaTargetMinutes`, `warningMinutes`, `cooldownMinutes`, `escalationChannel`)
  - assignment policy (`autoAssigneeId`, `autoAssignMode`, `autoAssignNote`)
  - execution counts (`candidates`, `escalated`, `assigned`, `skippedEscalation`, `skippedAssigned`, `failed`, `dryRun`)

## Rollback Plan

- Revert WI-0078 commit and disable `/scheduling/anomalies/incidents/auto-actions` route.
- No DB rollback required.
