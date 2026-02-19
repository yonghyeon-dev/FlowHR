# RFC: Approval Policy, Delegation, and Template Baseline (WI-0103 + WI-0107 + WI-0108 + WI-0109 + WI-0113 + WI-0115)

## Goal

Provide tenant-level approver role policy and temporary delegation so approval execution is controllable without changing RBAC mappings.

## Decisions

1. Approval policy is stored per organization with three domains: attendance, leave, payroll.
2. Approval delegation is time-bounded and additive to role policy, not a replacement for permission checks.
3. Existing decision endpoints (attendance approve/reject, leave approve/reject, payroll confirm) must pass policy/delegation gate.
4. Admin UI is delivered at `/admin/approval-policy` for direct operational control.
5. Delegation lifecycle includes auto-expiry command endpoint with dry-run support for ops safety.
6. Scheduler workflow executes a multi-organization expiry sweep to keep delegation board state clean without manual action.
7. Approval line template provides a domain-level role-set override, and active template is applied before single-role policy fallback.
8. Template activation is constrained to one active template per organization and domain to keep gate behavior deterministic.
9. PAYROLL domain template can define optional gross-pay min/max bounds; when bounds do not match, gate falls back to policy role.
10. Gate preview endpoint provides read-only simulation output using the same template/policy/delegation resolution logic as runtime gate.

## Non-Goals

- Multi-step approval line graph.
- Delegation email/notification workflow.
- External workflow engine integration.

## Risks

- Misconfigured policy could block operational approvals.
- Misconfigured active template could widen or block approver gate unexpectedly.
- Misconfigured PAYROLL threshold bounds could route approvals to unintended role.
- Delegation windows with wrong timezone input could cause false denials.

## Mitigations

- Default fallback policy keeps behavior compatible when no policy is configured.
- Active-template uniqueness guard (organization+domain) prevents ambiguous gate expectations.
- PAYROLL condition mismatch is designed to fallback to policy role instead of hard deny.
- Policy and delegation changes are audited and evented for traceability.
