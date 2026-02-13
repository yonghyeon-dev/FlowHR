# QA Gate Checklist

## Spec Gate (Before Implementation)

- [ ] Scope is clear, with explicit in/out boundaries.
- [ ] `contract.yaml` exists and required fields are complete.
- [ ] Authorization matrix covers all sensitive actions.
- [ ] Payroll accuracy rules and invariants are defined.
- [ ] Audit events are specified.
- [ ] Migration strategy and rollback plan exist.
- [ ] Test cases include positive, negative, and regression paths.

## Code Gate (Before Merge)

- [ ] Unit and integration tests pass.
- [ ] WI-0001 e2e flow test passes (record -> approve -> payroll preview).
- [ ] Regression checks pass, including golden fixtures.
- [ ] Lint/type checks pass.
- [ ] Migration smoke check passes (or marked N/A with reason).
- [ ] Security-impacting changes include ADR/reference.
- [ ] QA risk assessment is updated.
- [ ] Required approvals present; no unresolved blocker.
