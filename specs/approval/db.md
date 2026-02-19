# Approval DB Notes

## Tables

- `ApprovalPolicy`
  - one row per organization (`organizationId` unique)
  - stores approver role for `attendance`, `leave`, `payroll`
- `ApprovalDelegation`
  - many rows per organization
  - stores `domain`, `delegatorRole`, `delegateActorId`, active window (`startsAt`, `endsAt`), and `active`
- `ApprovalLineTemplate`
  - many rows per organization (one active row per organization+domain)
  - stores `name`, `domain`, `approverRoles[]`, optional PAYROLL condition bounds (`payrollGrossPayMinKrw`, `payrollGrossPayMaxKrw`), and `active`

## Migration

- `202602180004_approval_policy_delegation`
- `202602190001_approval_line_template`
- `202602190002_approval_template_payroll_condition`

## Compatibility

- Additive schema only; no existing columns/tables removed.
- Role-permission seeds use `ON CONFLICT DO NOTHING`.
- Approval template active uniqueness is enforced at service layer (organization+domain).
- PAYROLL template condition bounds are additive nullable columns; non-PAYROLL templates keep null bounds.
