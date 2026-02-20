# WI-0118: Approval Execution State Machine Baseline

## Background and Problem

Multi-stage templates were introduced in WI-0117, but runtime approval still used stage-1 compatibility mode only. This made a stage-1 approval finalize attendance/leave/payroll immediately, so real step-by-step execution could not be enforced.

## Scope

### In Scope

- Add approval execution runtime model (`ApprovalExecution`, `ApprovalExecutionActionLog`).
- Execute approval actions by stage for attendance approve/reject, leave approve/reject, and payroll confirm.
- Finalize domain state only when execution reaches final stage.
- Persist action-level stage history labels (`{stageLabel}:{action}`).
- Add execution list API (`GET /approval/executions`) for troubleshooting and operator visibility.
- Add e2e regression for staged progression and finalization across attendance/leave/payroll.

### Out of Scope

- Generic non-domain approval command API (all actions are invoked from domain endpoints).
- External groupware sync and notification fan-out.
- Stage-level SLA/escalation automation.

## User Scenarios

1. Manager approves attendance at stage 1, and the record remains `PENDING`.
2. Admin approves stage 2, and the same attendance record transitions to `APPROVED`.
3. Manager approves leave at stage 1, and leave balance does not change until admin final approval.
4. Manager confirms payroll at stage 1, and payroll run remains `PREVIEWED` until admin final confirmation.

## Payroll Accuracy and Calculation Rules

- Payroll arithmetic does not change.
- PAYROLL conditional template matching (`payrollGrossPayKrw`) is evaluated before stage execution.
- Payroll run state transitions to `CONFIRMED` only when approval execution state reaches `APPROVED`.

## Authorization and Role Matrix

| Action | Admin | Manager | Payroll Operator | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Stage action execution (domain endpoints) | Allow (permission + policy/delegation gate) | Allow (permission + policy/delegation gate) | Allow (permission + policy/delegation gate) | Deny | Allow |
| Approval execution list read | Allow | Allow | Allow | Deny | Allow |

## Data Changes

- Tables:
  - `ApprovalExecution`
  - `ApprovalExecutionActionLog`
- Migration IDs:
  - `202602190006_approval_execution_state_machine`
- Backward compatibility plan:
  - additive schema only; existing approval policy/delegation/template/history rows are untouched.

## API and Event Changes

- New endpoint:
  - `GET /approval/executions`
- Existing domain endpoints changed in behavior:
  - `POST /attendance/records/{recordId}/approve`
  - `POST /attendance/records/{recordId}/reject`
  - `POST /leave/requests/{requestId}/approve`
  - `POST /leave/requests/{requestId}/reject`
  - `POST /payroll/runs/{runId}/confirm`
- Events:
  - No new event types.
  - Existing finalization events (`attendance.approved.v1`, `leave.approved.v1`, `payroll.confirmed.v1`) are emitted only on final stage completion.

## Test Plan

- Unit:
  - execution state transition guards (approved/rejected terminal state)
  - duplicate actor approve/reject guard per stage
- Integration:
  - stage-1 approve keeps target domain state pending
  - final-stage approve/reject finalizes target state
  - execution list API filters by organization/domain/target/state
- Regression:
  - existing single-stage policy/template flow remains unchanged
  - leave balance usage occurs only after final approval stage
  - payroll confirm remains previewed until final stage
- Authorization:
  - execution list API requires approval policy read permission
  - stage execution still requires existing domain permissions

## Observability and Audit Logging

- Audit events:
  - `approval.execution.listed`
  - existing domain finalization audits remain unchanged (`attendance.approved`, `leave.approved`, `payroll.confirmed`)
- Stage history:
  - stage labels now include action suffix (`manager-review:approve`, `admin-final:approve`).

## Rollback Plan

- Stop using staged templates by deactivating them (or reducing to single stage).
- Keep execution/action log tables as additive artifacts.
- Revert domain endpoints to stage-1 compatibility if emergency rollback is required.

## Definition of Ready (DoR)

- [x] Multi-stage runtime execution behavior agreed (finalize only at terminal stage).
- [x] Data model for execution/action logs defined.
- [x] Domain endpoint impact scope identified.
- [x] Regression scenarios (attendance/leave/payroll) identified.

## Definition of Done (DoD)

- [x] Execution/action tables and stores are implemented (memory + prisma).
- [x] Domain approval endpoints enforce staged finalization.
- [x] Execution list API is added with permission gate.
- [x] WI-0118 e2e regression is added and wired to MVP/FULL suites.
- [x] Approval specs/roadmap/data-ownership docs are updated.
