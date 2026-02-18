# WI-0103: Approval Line and Delegation Policy Baseline

## Background and Problem

Current approval actions (attendance/leave/payroll) rely on static permission checks only. There is no organization-level policy to define who is the default approver by domain, and no temporary delegation model for coverage during absence.

## Scope

### In Scope

- Add approval policy model for organization-level approver role mapping (attendance/leave/payroll).
- Add approval delegation model with active window.
- Add approval domain APIs for policy read/write and delegation list/create/update.
- Enforce approval policy/delegation gate in attendance approve/reject, leave approve/reject, payroll confirm.
- Add admin UI page to manage policy and delegations.

### Out of Scope

- Multi-step approval line graph and conditional routing.
- External approval systems integration (ERP/groupware).
- Mobile approval UX.

## User Scenarios

1. Admin sets attendance approver role to `admin` for a tenant.
2. During admin absence, admin delegates attendance approval authority to a manager for a fixed period.
3. Manager can approve attendance only while delegation is active.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: payroll confirmation role gate follows approval policy per organization.
- Rounding rule: not applicable.
- Exception handling rule: privileged `admin/system` can always execute emergency confirmations.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Read approval policy | Allow | Allow | Deny | Allow |
| Upsert approval policy | Allow | Deny | Deny | Allow |
| List approval delegations | Allow | Allow | Deny | Allow |
| Create/update approval delegations | Allow | Allow (manager delegator only) | Deny | Allow |
| Approve attendance with policy/delegation gate | Allow | Conditional | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables: `ApprovalPolicy`, `ApprovalDelegation`, `RolePermission`
- Migration IDs: `202602180004_approval_policy_delegation`
- Backward compatibility plan: additive schema and permission seed (idempotent insert).

## API and Event Changes

- Endpoints:
  - `GET /approval/policy`
  - `PUT /approval/policy`
  - `GET /approval/delegations`
  - `POST /approval/delegations`
  - `PATCH /approval/delegations/{delegationId}`
- Events published:
  - `approval.policy.updated.v1`
  - `approval.delegation.created.v1`
  - `approval.delegation.updated.v1`
- Events consumed: none

## Test Plan

- Unit: schema validation for policy/delegation payloads.
- Integration: policy fallback and upsert lifecycle.
- Regression: attendance/leave/payroll approval paths respect policy gate.
- Authorization: manager cannot create non-manager delegator entries.
- Payroll accuracy: payroll confirmation is blocked when policy gate is not satisfied.

## Observability and Audit Logging

- Audit events:
  - `approval.policy.updated`
  - `approval.delegation.created`
  - `approval.delegation.updated`
- Metrics:
  - `approval_policy_update_count`
  - `approval_delegation_active_count`
- Alert conditions:
  - repeated `403` policy gate failures on approval endpoints.

## Rollback Plan

- Feature flag behavior: not required (baseline capability).
- DB rollback method: disable approval policy/delegation usage and revert by migration rollback in maintenance window.
- Recovery target time: 30m.

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Prisma schema/migration and DataAccess stores are added.
- [ ] Approval API routes and service enforcement are implemented.
- [ ] Admin UI for policy/delegation management is added.
- [ ] E2E and governance checks are green.
- [ ] QA Spec Gate and Code Gate are both passed.
