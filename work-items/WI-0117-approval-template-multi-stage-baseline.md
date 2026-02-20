# WI-0117: Approval Template Multi-Stage Routing Model Baseline

## Background and Problem

Current approval template uses a single role set, so operations cannot represent real approval lines (for example, manager review followed by admin final review). This blocks deterministic stage-by-stage governance while preserving backward compatibility.

## Scope

### In Scope

- Extend approval template model with ordered stage definitions (`approvalStages`).
- Persist stage definitions in template storage and return them via template/preview APIs.
- Keep runtime gate compatibility by mapping current gate role set to stage-1 approver roles.
- Add validation for stage index/order/min-approval rules.
- Add e2e regression covering create/update/list/gate-preview behavior with multi-stage templates.

### Out of Scope

- Full multi-step runtime execution state machine.
- Stage-by-stage human approval action APIs.
- External groupware synchronization.

## User Scenarios

1. Admin creates ATTENDANCE template with 2 stages: `manager-review` then `admin-final`.
2. System keeps stage-1 approver role set as current runtime gate role set.
3. Admin updates stage-1 role to `admin`, and subsequent gate results reflect the change immediately.

## Payroll Accuracy and Calculation Rules

- Payroll arithmetic is unchanged.
- PAYROLL gross-pay conditional routing continues to evaluate before stage-1 role gate.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Create/update multi-stage template | Allow | Deny | Deny | Deny | Allow |
| Read templates with stage definitions | Allow | Allow | Allow | Deny | Allow |
| Execute runtime gate (stage-1 compatibility mode) | Conditional | Conditional | Conditional | Deny | Allow |

## Data Changes

- Tables: `ApprovalLineTemplate`
- Column additions: approvalStagesJson (JSONB, non-null)
- Migration IDs: `202602190005_approval_template_multi_stage`
- Backward compatibility plan: migration backfills existing templates to single-stage payload.

## API and Event Changes

- Endpoints:
  - `GET /approval/templates` (response includes `approvalStages`)
  - `POST /approval/templates` (accept optional `approvalStages`)
  - `PATCH /approval/templates/{templateId}` (accept optional `approvalStages`)
  - `POST /approval/policy/gate-preview` (matched template payload includes `approvalStages`)
- Events published:
  - `approval.template.created.v1` (payload extended with `approvalStages`)
  - `approval.template.updated.v1` (payload extended with `approvalStages`)
- Events consumed: none

## Test Plan

- Unit:
  - schema validation for stage uniqueness and min-approval constraints
  - service validation for sequential stage indexes and stage limits
- Integration:
  - create template with multi-stage payload persists stage definitions
  - update template stage set rewrites stage-1 gate role set
  - list templates returns stage definitions
- Regression:
  - runtime gate remains backward compatible (stage-1 role gate)
  - preview response includes stage payload for matched templates
- Authorization:
  - manager cannot mutate template stages
- Payroll accuracy:
  - PAYROLL condition routing remains deterministic with stage-enabled template

## Observability and Audit Logging

- Audit events:
  - `approval.template.created`
  - `approval.template.updated`
- Metrics:
  - `approval_template_active_count`
  - `approval_policy_gate_denied_count`
- Alert conditions:
  - repeated gate denials after stage-1 role change.

## Rollback Plan

- Disable stage-based updates and revert to policy fallback templates.
- Keep backfilled `approvalStagesJson` column as passive data if rollback is needed.
- Recovery target: 30m.

## Definition of Ready (DoR)

- [x] Multi-stage model boundaries (template model only) are agreed.
- [x] Backward compatibility strategy (stage-1 mapping) is defined.
- [x] Contract/API/test-case update scope is identified.
- [x] Migration/backfill plan is prepared.

## Definition of Done (DoD)

- [x] `approvalStagesJson` migration and runtime mapping are implemented.
- [x] Template create/update/list/preview flows expose `approvalStages`.
- [x] Stage validation and compatibility mapping are enforced.
- [x] WI-0117 e2e regression is added to MVP/FULL suites.
- [x] Approval contract/api/rfc/db/test-cases and roadmap are updated.
