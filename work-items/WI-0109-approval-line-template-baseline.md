# WI-0109: Approval Line Template Baseline

## Background and Problem

Current approval governance supports a single role per domain through policy plus temporary delegation. This is not enough for practical operations where one domain may require a role set (for example, `manager` or `admin`) without rewriting policy each time.

## Scope

### In Scope

- Add approval line template model per organization and domain.
- Add template APIs: list/create/update.
- Enforce active template uniqueness per organization+domain.
- Apply template role set to approval gate before policy fallback.
- Add admin UI page for template operations.
- Add e2e regression for template lifecycle and gate behavior.

### Out of Scope

- Multi-step routing/approval graph.
- Conditional branch logic by amount, department, or document type.
- External groupware synchronization.

## User Scenarios

1. Admin creates an active attendance template with roles `manager,admin`.
2. Manager can approve attendance while template is active even when policy role is `admin`.
3. Admin deactivates template and gate falls back to policy role.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: payroll confirmation still follows approval gate, and template applies only when domain is `PAYROLL`.
- Rounding rule: not applicable.
- Exception handling rule: privileged roles (`admin`, `system`) retain override behavior.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| List approval templates | Allow | Allow | Deny | Allow |
| Create/update approval templates | Allow | Deny | Deny | Allow |
| Approve with template gate | Allow | Conditional | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables: `ApprovalLineTemplate`
- Migration IDs: `202602190001_approval_line_template`
- Backward compatibility plan: additive table/index creation only.

## API and Event Changes

- Endpoints:
  - `GET /approval/templates`
  - `POST /approval/templates`
  - `PATCH /approval/templates/{templateId}`
- Events published:
  - `approval.template.created.v1`
  - `approval.template.updated.v1`
- Events consumed: none

## Test Plan

- Unit: template schema validation (`approverRoles` dedupe/min-size).
- Integration: create/list/update template lifecycle + active uniqueness conflict.
- Regression: approval gate policy fallback/override behavior with template activation and deactivation.
- Authorization: manager template write blocked with 403.
- Payroll accuracy: payroll confirm gate remains policy/template/delegation consistent.

## Observability and Audit Logging

- Audit events:
  - `approval.template.created`
  - `approval.template.updated`
- Metrics:
  - `approval_template_active_count`
  - `approval_policy_gate_denied_count`
- Alert conditions:
  - repeated `409` template active conflict for same organization/domain.

## Rollback Plan

- Feature flag behavior: reuse existing approval policy baseline (no new flag required).
- DB rollback method: deactivate templates and rollback migration during maintenance window if required.
- Recovery target time: 30m.

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [x] Prisma schema/migration for approval template is added.
- [x] Template APIs and approval gate override logic are implemented.
- [x] Admin template management UI is added (`/admin/approval-templates`).
- [x] E2E and governance checks are green.
- [x] QA Spec Gate and Code Gate are both passed.
