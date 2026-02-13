# WI-0001: Attendance Record to Payroll Reflection Vertical Slice

## Background and Problem

FlowHR needs a verified end-to-end slice that proves contract-first delivery:
attendance records must flow into attendance aggregation and then into payroll gross pay calculation with audit traceability.

## Scope

### In Scope

- Attendance record create/update/approve path.
- Attendance aggregation for payable minutes.
- Payroll gross pay preview based on aggregated minutes.
- Contract and test case artifacts for attendance and payroll domains.

### Out of Scope

- Tax and deduction computation.
- Multi-country labor policy handling.
- Final payroll disbursement integration.

## User Scenarios

1. Employee records attendance, manager approves, system aggregates payable minutes.
2. Payroll operator runs gross pay preview for the current payroll cycle.
3. Retroactive attendance correction triggers recalculated payroll preview with audit events.

## Payroll Accuracy and Calculation Rules

- Source of truth: `specs/common/time-and-payroll-rules.md`.
- Time zone: `Asia/Seoul`.
- Workday boundary: `04:00`.
- Gross pay only for MVP.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| Create attendance record | Allow | Allow | Allow | Deny |
| Approve attendance correction | Allow | Allow | Deny | Deny |
| Run payroll preview | Allow | Deny | Deny | Allow |
| Confirm payroll run | Allow | Deny | Deny | Allow |

## Data Changes (Tables and Migrations)

- Attendance tables: `attendance_records`, `attendance_corrections`, `attendance_approvals`.
- Payroll tables: `payroll_periods`, `payroll_runs`, `payroll_items`.
- Migration IDs:
  - `2026021301_attendance_base`
  - `2026021302_payroll_base`

## API and Event Changes

- Attendance API:
  - `POST /attendance/records`
  - `POST /attendance/records/{id}/approve`
- Payroll API:
  - `POST /payroll/runs/preview`
- Published events:
  - `attendance.approved`
  - `payroll.calculated`

## Test Plan

- Unit:
  - Attendance minute categorization
  - Payroll gross amount calculator
- Integration:
  - Attendance approval to payroll preview flow
- Regression:
  - Golden fixtures `GC-001` to `GC-005`
- Authorization:
  - Role-based access checks on approval and payroll endpoints
- Payroll accuracy:
  - Overtime/night/holiday multiplier and rounding checks

## Observability and Audit Logging

- Audit events:
  - `attendance.recorded`
  - `attendance.corrected`
  - `attendance.approved`
  - `payroll.calculated`
- Metrics:
  - payroll preview latency
  - recalculation count
- Alert:
  - payroll calculation failure rate above threshold

## Rollback Plan

- Feature flags:
  - `attendance_v1`
  - `payroll_preview_v1`
- Rollback by disabling flags and restoring prior read path.
- Migration rollback per migration playbook in deployment runbook.

## Definition of Ready (DoR)

- [x] Scope and constraints documented.
- [x] Attendance and payroll contracts drafted.
- [x] Shared time/payroll rule SSoT linked.
- [x] Golden regression fixture baseline defined.
- [x] QA Spec Gate checklist reviewed.

## Definition of Done (DoD)

- [ ] Contract governance checks pass in CI.
- [ ] Attendance and payroll tests pass.
- [ ] Golden fixture regression passes.
- [ ] QA Code Gate approved.
- [ ] ADR linked if breaking or architecture-affecting changes occur.
