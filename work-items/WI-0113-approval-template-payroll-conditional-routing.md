# WI-0113: Approval Template Payroll Conditional Routing

## Background and Problem

Current approval template baseline supports only static role-set override per domain. For payroll confirmations, this is too coarse because high-amount runs may require stricter approver roles while lower amounts should keep policy fallback.

## Scope

### In Scope

- Extend `ApprovalLineTemplate` with optional PAYROLL gross-pay condition bounds.
- Apply template role-set only when PAYROLL condition matches; otherwise fallback to policy role.
- Keep existing active-template uniqueness (organization + domain).
- Add admin template UI inputs for PAYROLL condition.
- Add e2e regression for match/fallback gate behavior.

### Out of Scope

- Multi-step approval graph.
- External groupware workflow integration.
- Document-type/department-based branching.

## User Scenarios

1. Admin sets PAYROLL template with `payrollGrossPayMinKrw=90000` and `approverRoles=[admin]`.
2. Payroll operator cannot confirm run with `grossPayKrw=96000` because template condition matches and requires admin.
3. Payroll operator can confirm run with `grossPayKrw=80000` because template condition does not match and gate falls back to policy role.

## Payroll Accuracy and Calculation Rules

- This WI does not modify payroll formulas.
- Gate input uses persisted payroll run `grossPayKrw` at confirm time.

## Authorization and Role Matrix

| Action | Admin | Payroll Operator | Manager | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Create/update template condition | Allow | Deny | Deny | Deny | Allow |
| Confirm high payroll run under conditional template | Allow | Conditional (deny) | Deny | Deny | Allow |
| Confirm low payroll run under conditional template | Allow | Conditional (allow via policy fallback) | Deny | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables: `ApprovalLineTemplate`
- Migration IDs: `202602190002_approval_template_payroll_condition`
- Backward compatibility plan: additive nullable columns only.

## API and Event Changes

- Endpoints:
  - `POST /approval/templates` (add optional `payrollGrossPayMinKrw`, `payrollGrossPayMaxKrw`)
  - `PATCH /approval/templates/{templateId}` (same optional fields)
- Events published:
  - `approval.template.created.v1` (payload includes condition fields)
  - `approval.template.updated.v1` (payload includes condition fields)
- Events consumed: none

## Test Plan

- Unit:
  - schema/service validation for non-PAYROLL domain with payroll condition fields
  - min/max bound ordering validation
- Integration:
  - condition match -> template role gate applies
  - condition mismatch -> policy fallback applies
- Regression:
  - existing template activation/deactivation gate behavior remains valid
- Authorization:
  - manager/payroll_operator cannot mutate template condition fields
- Payroll accuracy:
  - payroll amount values unchanged by gate logic

## Observability and Audit Logging

- Audit events:
  - `approval.template.created`
  - `approval.template.updated`
- Metrics:
  - `approval_template_active_count`
  - `approval_policy_gate_denied_count`
- Alert conditions:
  - repeated payroll confirm denials around template threshold values.

## Rollback Plan

- Set PAYROLL template bounds to null (or deactivate template) to restore policy-only routing.
- Revert migration and service logic if conditional routing causes false denials.
- Recovery target time: 30m.

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract/api/test-cases update plan is defined.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [x] Approval template condition columns/migration added.
- [x] Policy gate applies PAYROLL condition match/fallback behavior.
- [x] Admin template UI supports condition input for PAYROLL.
- [x] WI-0113 e2e regression is added and wired to e2e suite.
- [x] Lint/typecheck/tests/contract/traceability checks pass.
