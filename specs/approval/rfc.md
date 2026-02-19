# RFC: Approval Policy and Delegation Baseline (WI-0103 + WI-0107)

## Goal

Provide tenant-level approver role policy and temporary delegation so approval execution is controllable without changing RBAC mappings.

## Decisions

1. Approval policy is stored per organization with three domains: attendance, leave, payroll.
2. Approval delegation is time-bounded and additive to role policy, not a replacement for permission checks.
3. Existing decision endpoints (attendance approve/reject, leave approve/reject, payroll confirm) must pass policy/delegation gate.
4. Admin UI is delivered at `/admin/approval-policy` for direct operational control.
5. Delegation lifecycle includes auto-expiry command endpoint with dry-run support for ops safety.

## Non-Goals

- Multi-step approval line graph and template engine.
- Delegation email/notification workflow.
- External workflow engine integration.

## Risks

- Misconfigured policy could block operational approvals.
- Delegation windows with wrong timezone input could cause false denials.

## Mitigations

- Default fallback policy keeps behavior compatible when no policy is configured.
- Policy and delegation changes are audited and evented for traceability.
