# Approval Test Cases (v0.5.0)

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

## Regression

1. Attendance approve/reject endpoint still enforces existing permission checks.
2. Leave approve/reject endpoint still updates balance/audit/event as before.
3. Payroll confirm endpoint still allows privileged role with proper permission.
4. Existing delegation create/update/list paths remain backward compatible after expire endpoint addition.
5. Scheduler dry-run must not mutate active delegation rows in any target organization.
6. Existing policy/delegation APIs stay backward compatible after template endpoint addition.
7. Payroll confirm gate falls back to policy role when active PAYROLL template condition does not match.
8. Gate preview decision remains consistent with runtime gate role resolution.

## Evidence

- `scripts/tests/e2e-wi0103-approval-policy-delegation.test.ts`
- `scripts/tests/e2e-wi0107-approval-delegation-expiry.test.ts`
- `scripts/tests/e2e-wi0108-approval-delegation-expiry-scheduler.test.ts`
- `scripts/tests/e2e-wi0109-approval-line-template.test.ts`
- `scripts/tests/e2e-wi0113-approval-template-payroll-conditional-routing.test.ts`
- `scripts/tests/e2e-wi0115-approval-gate-preview.test.ts`
