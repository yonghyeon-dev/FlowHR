# WI-0003: Leave Accrual and Carry-Over Settlement

## Background and Problem

FlowHR currently supports leave request lifecycle but does not provide yearly accrual/carry-over settlement.
Without settlement, leave balance resets are manual and error-prone, causing payroll and audit risks.

## Scope

### In Scope

- Annual leave accrual settlement API for a target employee.
- Carry-over cap rule application and yearly balance reset.
- Duplicate-year settlement guard.
- Contract/test artifact updates for leave domain.

### Out of Scope

- Multi-policy accrual by employee grade/tenure.
- Automatic scheduler/batch orchestration.
- External calendar/groupware synchronization.

## User Scenarios

1. Payroll operator settles year-end leave for an employee.
2. System applies carry-over cap and resets used days for new cycle.
3. Duplicate settlement for the same employee/year is blocked with auditable evidence.

## Payroll Accuracy and Calculation Rules

- Source of truth: `specs/common/time-and-payroll-rules.md`.
- Carry-over formula: `min(max(remainingDays, 0), carryOverCapDays)`.
- New cycle granted days: `annualGrantDays + carryOverAppliedDays`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| Settle leave accrual | Allow | Deny | Deny | Allow |
| Read leave balance | Allow | Allow | Allow (self) | Allow |
| Approve/reject leave request | Allow | Allow | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables:
  - `LeaveBalanceProjection`
- Migration IDs:
  - `202602140001_wi0002_leave_base`
  - `202602140002_wi0003_leave_accrual`
- Backward compatibility plan:
  - Additive columns only (carryOverDays, lastAccrualYear) with safe defaults.

## API and Event Changes

- Endpoints:
  - `POST /leave/accrual/settle`
- Events published:
  - `leave.accrual.settled.v1`
- Events consumed:
  - none

## Test Plan

- Unit:
  - carry-over cap and yearly grant calculations
- Integration:
  - approve leave -> settle accrual flow
  - duplicate-year settlement rejection
- Regression:
  - leave balance continuity for subsequent request cycles
- Authorization:
  - admin/payroll operator allow, employee/manager deny
- Payroll accuracy:
  - carry-over cap and yearly reset output validation

## Observability and Audit Logging

- Audit events:
  - `leave.accrual_settled`
- Metrics:
  - `leave_accrual_settlement_count`
  - `leave_accrual_duplicate_reject_count`
- Alert conditions:
  - abnormal duplicate settlement reject spikes

## Rollback Plan

- Feature flag behavior:
  - `leave_accrual_v1` off -> revert to manual settlement operation.
- DB rollback method:
  - additive columns remain; stop writes and ignore new fields.
- Recovery target time:
  - 30 minutes

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.
