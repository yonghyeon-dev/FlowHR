# Approval Test Cases (v0.1.0)

## Positive

1. Read policy returns default fallback when no policy row exists.
2. Admin upserts policy and reads configured values.
3. Admin creates delegation and manager can execute delegated attendance approval while active.
4. Admin deactivates delegation and delegated manager is denied afterwards.

## Negative

1. Manager cannot create delegation with `delegatorRole=admin`.
2. Delegation create/update rejects `endsAt <= startsAt`.
3. Tenant-scoped actor cannot mutate another organization policy/delegation.
4. Policy gate denies approval when actor role does not match required role and no active delegation exists.

## Regression

1. Attendance approve/reject endpoint still enforces existing permission checks.
2. Leave approve/reject endpoint still updates balance/audit/event as before.
3. Payroll confirm endpoint still allows privileged role with proper permission.

## Evidence

- `scripts/tests/e2e-wi0103-approval-policy-delegation.test.ts`
