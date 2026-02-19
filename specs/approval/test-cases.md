# Approval Test Cases (v0.8.0)

## Positive

1. Read policy returns default fallback when no policy row exists.
2. Admin upserts policy and reads configured values.
3. Admin creates delegation and manager can execute delegated attendance approval while active.
4. Admin deactivates delegation and delegated manager is denied afterwards.
5. Admin runs delegation expire command in dry-run mode and receives deterministic candidate counts without mutation.
6. Admin runs delegation expire command in apply mode and only expired active delegations are deactivated.
7. Scheduler sweep runs across multiple organizations and returns deterministic per-organization counts.
8. Admin creates an active approval template and manager approval succeeds when template includes `manager`.
9. Admin deactivates template and approval gate falls back to policy role.
10. Admin creates PAYROLL template with `payrollGrossPayMinKrw`, and template gate is applied only when payroll gross pay matches threshold.
11. Admin runs gate preview and receives expected roles/template matches for both matched and non-matched PAYROLL conditions.
12. Admin runs gate preview with delegated actor and receives `active_delegation` allow result when delegation is valid.
13. Runtime attendance gate writes DENIED stage-history when non-approver actor attempts approval.
14. Runtime attendance gate writes PRIVILEGED_BYPASS stage-history when admin actor approves.
15. Admin/manager reads stage-history with domain/target/resolution filters and receives deterministic ordering.
16. Admin creates multi-stage template and API persists ordered stage payload.
17. Admin updates multi-stage template stage-1 role, and runtime gate expected role switches to updated stage-1.
18. Multi-stage attendance approval keeps record `PENDING` after stage-1 manager approve and finalizes as `APPROVED` only after stage-2 admin approve.
19. Multi-stage leave approval keeps request `PENDING` and leaves balance unchanged until final stage.
20. Multi-stage payroll confirmation keeps run `PREVIEWED` until final stage and then transitions to `CONFIRMED`.
21. Admin reads `GET /approval/executions` and verifies state/stage progression for target entity.

## Negative

1. Manager cannot create delegation with `delegatorRole=admin`.
2. Delegation create/update rejects `endsAt <= startsAt`.
3. Tenant-scoped actor cannot mutate another organization policy/delegation.
4. Policy gate denies approval when actor role does not match required role and no active delegation exists.
5. Non-privileged actor cannot execute delegation expire command.
6. Manager cannot create or update approval templates.
7. Active template duplicate create/update in same organization+domain is rejected with `409`.
8. Non-PAYROLL template create/update with payroll gross-pay condition fields is rejected with `400`.
9. Gate preview rejects `payrollGrossPayKrw` payload when domain is not `PAYROLL`.
10. Stage-history list query rejects invalid `resolution`, datetime, or out-of-range `limit`.
11. Template create/update rejects duplicate stage index or `minApprovals > approverRoles.length`.
12. Stage-2 action with non-required role is rejected with `403`.
13. Duplicate actor approve on the same stage is rejected with `409`.

## Regression

1. Attendance approve/reject endpoint still enforces existing permission checks.
2. Leave approve/reject endpoint still updates balance/audit/event as before.
3. Payroll confirm endpoint still allows privileged role with proper permission.
4. Existing delegation create/update/list paths remain backward compatible after expire endpoint addition.
5. Scheduler dry-run must not mutate active delegation rows in any target organization.
6. Existing policy/delegation APIs stay backward compatible after template endpoint addition.
7. Payroll confirm gate falls back to policy role when active PAYROLL template condition does not match.
8. Gate preview decision remains consistent with runtime gate role resolution.
9. Stage-history listing endpoint remains read-only and does not mutate approval policy/delegation/template state.
10. Stage-enabled template remains backward compatible with stage-1 runtime gate behavior.
11. Single-stage template behavior remains equivalent to pre-WI-0118 finalization behavior.

## Evidence

- `scripts/tests/e2e-wi0103-approval-policy-delegation.test.ts`
- `scripts/tests/e2e-wi0107-approval-delegation-expiry.test.ts`
- `scripts/tests/e2e-wi0108-approval-delegation-expiry-scheduler.test.ts`
- `scripts/tests/e2e-wi0109-approval-line-template.test.ts`
- `scripts/tests/e2e-wi0113-approval-template-payroll-conditional-routing.test.ts`
- `scripts/tests/e2e-wi0115-approval-gate-preview.test.ts`
- `scripts/tests/e2e-wi0116-approval-stage-history-baseline.test.ts`
- `scripts/tests/e2e-wi0117-approval-template-multi-stage-baseline.test.ts`
- `scripts/tests/e2e-wi0118-approval-execution-state-machine.test.ts`
