# WI-0107: Approval Delegation Expiry Automation

## Background and Problem

Approval delegations can remain `active=true` after their time window is already over. The approval gate still blocks expired windows at runtime, but stale active rows increase operational noise and make admin review inaccurate.

## Scope

### In Scope

- Add delegation expiry command endpoint:
  - `POST /approval/delegations/expire`
  - supports `dryRun` and `expiresBeforeAt`
- Auto-deactivate only active delegations where `endsAt < expiresBeforeAt`.
- Add audit trace for auto-expired delegations.
- Reuse existing `approval.delegation.updated.v1` event with `autoExpired=true` payload marker.
- Update admin approval-policy UI:
  - fix policy/delegation response parsing from root payload
  - add "expire delegations" action with dry-run toggle and result summary
- Add e2e regression test for dry-run/apply flow.

### Out of Scope

- Scheduled background cron runner
- Notification fan-out on delegation expiry
- Multi-step approval template engine

## User Scenarios

1. Admin runs dry-run to preview how many active delegations are expired.
2. Admin applies expiry cleanup and sees only expired active delegations deactivated.
3. Admin keeps delegation board accurate without manual row-by-row deactivation.

## Accuracy and Lifecycle Rules

- Candidate selection:
  - `active=true`
  - `endsAt < expiresBeforeAt`
- Dry-run:
  - must return deterministic counts and IDs
  - must not mutate any delegation row
- Apply mode:
  - deactivates only selected candidates
  - leaves non-expired active delegations untouched

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| Read policy/delegations | Allow | Allow | Deny | Allow | Allow |
| Create/update delegation | Allow | Limited | Deny | Deny | Allow |
| Expire delegations command | Allow | Deny | Deny | Deny | Allow |

## Data Changes

- No Prisma schema changes
- No migration changes
- ApprovalDelegation active-flag lifecycle only

## API and Event Changes

- New endpoint:
  - `POST /approval/delegations/expire`
- Existing event reused with additive payload marker:
  - `approval.delegation.updated.v1` (`autoExpired=true`)
- New audit action:
  - `approval.delegation.auto_expired`

## Test Plan

- Unit:
  - expire command candidate filtering logic
  - dry-run no-mutation guard
- Integration:
  - expire dry-run/apply API behavior
  - permission guard for expire endpoint
- Regression:
  - existing policy/delegation lifecycle remains valid
  - approval gates for attendance/leave/payroll remain unchanged

## Observability and Audit Logging

- Audit:
  - `approval.delegation.auto_expired`
- Metrics:
  - `approval_delegation_expire_checked_count`
  - `approval_delegation_expire_applied_count`

## Rollback Plan

- Stop using expire endpoint and return to manual deactivation path.
- Existing delegation CRUD and approval policy features remain intact.
- No DB rollback required.

## Definition of Ready (DoR)

- [x] Expiry selection rules and dry-run behavior are specified.
- [x] Contract/API/test-case update scope is defined.

## Definition of Done (DoD)

- [x] Expire endpoint and service logic implemented.
- [x] Admin approval-policy page updated for expire action and payload parsing fix.
- [x] WI-0107 e2e regression test added and passing.
- [x] Approval contract/API/test-cases/RFC updated to `0.2.0`.
