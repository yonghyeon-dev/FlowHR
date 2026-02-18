# Approval DB Notes

## Tables

- `ApprovalPolicy`
  - one row per organization (`organizationId` unique)
  - stores approver role for `attendance`, `leave`, `payroll`
- `ApprovalDelegation`
  - many rows per organization
  - stores `domain`, `delegatorRole`, `delegateActorId`, active window (`startsAt`, `endsAt`), and `active`

## Migration

- `202602180004_approval_policy_delegation`

## Compatibility

- Additive schema only; no existing columns/tables removed.
- Role-permission seeds use `ON CONFLICT DO NOTHING`.
