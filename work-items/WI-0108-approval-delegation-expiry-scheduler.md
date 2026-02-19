# WI-0108: Approval Delegation Expiry Scheduler

## Background and Problem

WI-0107 added a manual expire endpoint, but operations still depend on an admin action from UI/API to clean expired delegations. In production this creates drift between configured delegation board and actual effective approval authority.

## Scope

### In Scope

- Add approval expiry sweep runner for scheduled execution.
- Sweep supports:
  - optional organization target list
  - default all-organization sweep for system actor
  - dry-run/apply modes
  - optional effective cutoff time override
- Add production workflow scheduler:
  - hourly run
  - manual dispatch with inputs
  - failure incident issue + webhook notification
- Add e2e regression test covering multi-organization sweep behavior.

### Out of Scope

- New approval API endpoint for sweep orchestration
- Delegation expiry notification fan-out
- Per-organization custom schedule policy

## User Scenarios

1. Operations runs scheduler hourly and expired delegations are automatically deactivated.
2. Operations runs manual dry-run to confirm which organizations/delegations will be affected.
3. Incident is raised automatically when scheduled sweep fails.

## Accuracy and Lifecycle Rules

- Sweep candidate in each organization:
  - `active=true`
  - `endsAt < expiresBeforeAt`
- `dryRun=true`:
  - returns deterministic organization-level counts and IDs
  - must not mutate delegation rows
- `dryRun=false`:
  - deactivates only candidates
  - leaves non-expired rows untouched

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| Sweep command (single org) | Allow | Deny | Deny | Deny | Allow |
| Sweep command (multi org/all orgs) | Deny | Deny | Deny | Deny | Allow |
| Scheduler workflow execution | Deny | Deny | Deny | Deny | Allow |

## Data Changes

- No Prisma schema changes
- No migration changes
- Delegation lifecycle mutation only on `ApprovalDelegation` active flag

## API and Event Changes

- No new API endpoint
- Existing command reused:
  - `POST /api/approval/delegations/expire`
- Existing event reused:
  - `approval.delegation.updated.v1` (`autoExpired=true`)
- Existing audit action reused:
  - `approval.delegation.auto_expired`

## Test Plan

- Unit:
  - organization target resolution (explicit list vs tenant/all)
  - dry-run no-mutation guard
- Integration:
  - sweep apply/dry-run behavior across multiple organizations
  - explicit organization-targeted apply behavior
- Regression:
  - WI-0107 endpoint behavior remains unchanged
  - approval policy/delegation create/list/update remains unchanged

## Observability and Audit Logging

- Workflow summary:
  - organization-level checked and expired counts
- Audit:
  - `approval.delegation.auto_expired`
- Incident signal:
  - GitHub issue with labels `incident,approval,ops` on scheduler failure

## Rollback Plan

- Disable scheduler workflow trigger.
- Continue manual cleanup via admin UI/API endpoint (`/approval/delegations/expire`).
- No DB rollback required.

## Definition of Ready (DoR)

- [x] Scheduler scope and target rules are documented.
- [x] Manual fallback path is identified.
- [x] Failure/alert handling policy is defined.

## Definition of Done (DoD)

- [x] Multi-organization sweep runner added.
- [x] Scheduled workflow added with manual dispatch inputs.
- [x] Failure incident and webhook alert wiring added.
- [x] WI-0108 e2e regression test added and passing.
- [x] Approval contract/API/test-cases/RFC updated to `0.2.1`.
