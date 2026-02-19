# Approval Test Cases (v0.3.0)

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

## Negative

1. Manager cannot create delegation with `delegatorRole=admin`.
2. Delegation create/update rejects `endsAt <= startsAt`.
3. Tenant-scoped actor cannot mutate another organization policy/delegation.
4. Policy gate denies approval when actor role does not match required role and no active delegation exists.
5. Non-privileged actor cannot execute delegation expire command.
6. Manager cannot create or update approval templates.
7. Active template duplicate create/update in same organization+domain is rejected with `409`.

## Regression

1. Attendance approve/reject endpoint still enforces existing permission checks.
2. Leave approve/reject endpoint still updates balance/audit/event as before.
3. Payroll confirm endpoint still allows privileged role with proper permission.
4. Existing delegation create/update/list paths remain backward compatible after expire endpoint addition.
5. Scheduler dry-run must not mutate active delegation rows in any target organization.
6. Existing policy/delegation APIs stay backward compatible after template endpoint addition.

## Evidence

- `scripts/tests/e2e-wi0103-approval-policy-delegation.test.ts`
- `scripts/tests/e2e-wi0107-approval-delegation-expiry.test.ts`
- `scripts/tests/e2e-wi0108-approval-delegation-expiry-scheduler.test.ts`
- `scripts/tests/e2e-wi0109-approval-line-template.test.ts`
