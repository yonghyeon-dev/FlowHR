# WI-0036: RBAC Engine Foundation (Replace Hardcoded Roles)

## Background and Problem

Authorization is currently based on a small set of hardcoded roles. For production HR SaaS, we need:

- tenant-scoped roles
- configurable role-to-permission mapping
- auditable permission changes

## Scope

### In Scope

- Define RBAC contract (roles, permissions, policies) and default role set.
- Add runtime authorization layer that maps JWT claims to tenant-scoped permissions.
- Add admin-only endpoints or tooling to manage roles/permissions (MVP minimal).
- Emit audit logs for permission/role changes.

### Out of Scope

- Fully custom per-customer permission UI.
- Fine-grained attribute-based access control (ABAC).

## User Scenarios

1. Admin assigns a role to a user in a tenant and access changes take effect.
2. Unauthorized actions are blocked consistently across attendance/leave/payroll APIs.

## Payroll Accuracy and Calculation Rules

- Not applicable.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Manage roles/permissions | Allow | Deny | Deny | N/A |
| Access attendance/leave/payroll APIs | Allow | Allow | Allow (limited) | N/A |

## Data Changes (Tables and Migrations)

- Tables:
  - `Role`
  - `RolePermission`
- Migration IDs:
  - `202602150001_rbac_foundation`
- Backward compatibility plan:
  - seed default role-permission mappings matching current behavior
  - keep legacy role checks behind a feature flag during rollout if needed

## API and Event Changes

- Endpoints:
  - `GET /rbac/roles`
  - `GET /rbac/roles/{roleId}`
  - `PUT /rbac/roles/{roleId}`
- Events published: none (audit only for MVP)
- Events consumed: none

## Test Plan

- Unit: permission resolution and policy checks
- Integration: protected endpoints reject unauthorized roles (403)
- Regression: existing e2e flows remain green with default roles

## Observability and Audit Logging

- Audit events: role assignment changes, permission changes
- Metrics: auth failures per endpoint (optional)
- Alert conditions: none initially

## Rollback Plan

- Feature flag behavior: keep hardcoded fallback available during rollout
- DB rollback method: not required initially
- Recovery target time: 30m

## Definition of Ready (DoR)

- [ ] RBAC contract drafted (roles, permissions, migration plan).
- [ ] Tenant model decision is explicit (single vs multi-tenant).

## Definition of Done (DoD)

- [ ] Hardcoded roles replaced by RBAC engine for core APIs.
- [ ] Permission changes are audited.
- [ ] CI remains green.

