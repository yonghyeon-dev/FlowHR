# WI-0116: Approval Stage History Baseline

## Background and Problem

Approval gate denials and bypasses are currently visible only at request time. Operators cannot later inspect why a specific attendance/leave/payroll decision was allowed or blocked, which increases triage time and rollback risk.

## Scope

### In Scope

- Add persisted stage-history model for runtime approval gate evaluations.
- Record stage history on attendance/leave/payroll decision gates.
- Provide filtered read API for stage-history retrieval.
- Add admin UI page for stage-history query and troubleshooting.
- Add e2e regression for deny/allow sequence and persisted resolution labels.

### Out of Scope

- Multi-step approval execution graph.
- External reporting export pipeline.
- Notification workflow from stage-history records.

## User Scenarios

1. Manager attempts attendance approval and is denied by policy gate.
2. Admin approves the same record and bypass is logged with resolution context.
3. Admin filters by target entity in `/admin/approval-history` and verifies deny/allow ordering.

## Payroll Accuracy and Calculation Rules

- Payroll formulas are unchanged.
- `payrollGrossPayKrw` is stored only as gate context when domain is `PAYROLL`.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Runtime gate evaluation write | Allow | Allow (when evaluating own action) | Allow (when evaluating own action) | Allow (when endpoint allowed) | Allow |
| Stage-history list read | Allow | Allow | Allow | Deny | Allow |
| Stage-history mutation API | Deny (internal only) | Deny | Deny | Deny | Deny |

## Data Changes

- Tables: `ApprovalStageHistory`
- Related tables: `ApprovalPolicy`, `ApprovalDelegation`, `ApprovalLineTemplate`
- Migration IDs: `202602190004_approval_stage_history_baseline`
- Backward compatibility plan: additive table only, no destructive changes.

## API and Event Changes

- Endpoints:
  - `GET /approval/stage-history`
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - stage-history resolution enum validation
  - list query schema validation (`limit`, `resolution`, date range)
- Integration:
  - denied runtime gate appends `DENIED` history
  - privileged runtime gate appends `PRIVILEGED_BYPASS` history
  - list API filters by domain/target entity/resolution
- Regression:
  - runtime gate policy/template/delegation behavior remains unchanged
  - stage-history ordering remains deterministic (`evaluatedAt desc`, `id desc`)
- Authorization:
  - stage-history list requires approval policy read permission
- Payroll accuracy:
  - PAYROLL stage-history context does not modify payroll arithmetic

## Observability and Audit Logging

- Audit events:
  - `approval.stage_history.listed`
- Metrics:
  - `approval_policy_gate_denied_count`
  - `approval_stage_history_list_count`
- Alert conditions:
  - repeated gate denials for same target entity within short window.

## Rollback Plan

- Disable admin history UI route and stop querying stage-history endpoint.
- Keep table as passive additive artifact while reverting gate append calls if needed.
- Recovery target: 30m.

## Definition of Ready (DoR)

- [x] Stage-history schema and resolution model are defined.
- [x] Domain/API/doc update scope is aligned.
- [x] Runtime gate append points are identified (attendance/leave/payroll).
- [x] Regression scenarios and evidence plan are agreed.

## Definition of Done (DoD)

- [x] `ApprovalStageHistory` model and migration are added.
- [x] Runtime gate appends history for deny/allow outcomes.
- [x] `GET /approval/stage-history` API and `/admin/approval-history` UI are added.
- [x] WI-0116 e2e regression is added and wired to MVP/FULL suites.
- [x] Approval contract/api/test-cases/rfc/db and roadmap/data-ownership docs are updated.
