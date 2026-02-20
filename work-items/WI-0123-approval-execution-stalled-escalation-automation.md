# WI-0123: Approval Execution Stalled Escalation Automation

## Background and Problem

WI-0121 added prioritized/stalled queue visibility for approval executions, but escalation was still manual.
Operators need a command path that can automatically notify stalled approval executions and support scheduled operations.

## Scope

### In Scope

- Add `POST /approval/executions/escalate` command API.
- Add stalled execution escalation dispatch through Discord/Slack webhook with dry-run support.
- Add escalation result panel and execute buttons to `/admin/approval-executions`.
- Add scheduler runner script for multi-organization sweep.
- Add GitHub workflow for periodic escalation runs.
- Add WI-0123 e2e coverage.

### Out of Scope

- Stage mutation auto-approve/auto-reject actions.
- Per-execution cooldown persistence model.
- External ticket creation (Jira/PagerDuty).

## User Scenarios

1. Admin reviews execution queue and runs escalation dry-run for stalled candidates.
2. Admin executes real escalation and receives delivery summary.
3. Scheduler runs escalation sweep periodically and posts summary to workflow output.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Trigger execution escalation command | Allow | Allow (permission-based) | Allow (permission-based) | Deny | Allow |

## Data and API Changes

- DB schema change: none.
- New endpoint: `POST /approval/executions/escalate`
  - Inputs: `organizationId?`, `domain?`, `stalledHoursMin?`, `limit?`, `asOf?`, `dryRun?`, `notificationChannel?`
  - Output: command policy/filter/counts/items summary.
- New runtime event:
  - `approval.execution.escalation.requested.v1`

## Observability and Audit

- Added audit actions:
  - `approval.execution.escalation.generated`
  - `approval.execution.escalation.requested`
  - `approval.execution.escalation.failed`
  - `approval.execution.escalation.event_publish_failed`

## Rollback Plan

- Disable scheduler workflow and only use queue listing.
- Keep API route deployed but execute only with `dryRun=true`.
- Remove escalation webhook env values to hard-stop external dispatch.
- Recovery target: 30m.

## Definition of Done (DoD)

- [x] Escalation command API + service dispatch path implemented.
- [x] Admin execution page can run dry-run and real escalation.
- [x] Scheduler runner and workflow added.
- [x] WI-0123 e2e added and connected to MVP/full suites.
- [x] approval specs, roadmap, and data-ownership docs updated.
