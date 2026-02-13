# WI-0002: Leave Request and Approval Contract Slice

## Background and Problem

FlowHR must support leave request and approval with auditable transitions so attendance/payroll can safely consume approved leave outcomes.
Without a contract-first leave slice, role abuse and balance miscalculation risks increase.

## Scope

### In Scope

- Leave request create/update/cancel flow before approval.
- Manager/admin approval and rejection flow with reason tracking.
- Leave balance read model contract and audit events.
- Contract and test-case artifacts for leave domain.

### Out of Scope

- National holiday calendar sync automation.
- Multi-policy accrual engine and carry-over settlement.
- External groupware leave sync.

## User Scenarios

1. Employee submits annual leave request and manager approves.
2. Employee edits request before final approval.
3. Manager rejects request with reason and employee sees final state.
4. Approved leave state is consumable by attendance/payroll domains.

## Payroll Accuracy and Calculation Rules

- Source of truth: `specs/common/time-and-payroll-rules.md`.
- Approved paid leave must be identifiable for payroll gross-pay inputs.
- Rejected/canceled leave must not contribute to payable time.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| Create leave request | Allow | Allow | Allow (self) | Deny |
| Update pending leave request | Allow | Allow | Allow (self) | Deny |
| Approve or reject request | Allow | Allow | Deny | Deny |
| Read leave balance | Allow | Allow | Allow (self) | Allow (read-only) |

## Data Changes (Tables and Migrations)

- Planned tables:
  - `LeaveRequest`
  - `LeaveApproval`
  - `LeaveBalanceProjection`
- Planned migration IDs:
  - `202602140001_wi0002_leave_base`
- Backward compatibility:
  - additive schema only for initial rollout

## API and Event Changes

- Endpoints:
  - `POST /leave/requests`
  - `PATCH /leave/requests/{requestId}`
  - `POST /leave/requests/{requestId}/approve`
  - `POST /leave/requests/{requestId}/reject`
  - `POST /leave/requests/{requestId}/cancel`
  - `GET /leave/balances/{employeeId}`
- Published events:
  - `leave.requested.v1`
  - `leave.approved.v1`
  - `leave.rejected.v1`
  - `leave.canceled.v1`
- Consumed events:
  - `employee.profile.updated.v1`

## Test Plan

- Unit:
  - state transition guard (pending -> approved/rejected only)
  - leave day span normalization by Asia/Seoul
- Integration:
  - create/update/approve full flow
  - reject flow with reason persistence
- Regression:
  - leave edge cases (boundary dates, overlapping request protection)
- Authorization:
  - self-service and manager/admin gate checks
- Payroll accuracy:
  - approved paid leave classification for payroll input

## Observability and Audit Logging

- Audit events:
  - `leave.requested`
  - `leave.approved`
  - `leave.rejected`
  - `leave.canceled`
- Metrics:
  - leave approval latency
  - rejection rate
- Alert conditions:
  - approval API 5xx spike
  - abnormal rejection surge per org

## Rollback Plan

- Feature flags:
  - `leave_request_v1`
  - `leave_approval_v1`
- Rollback method:
  - disable flags and route requests to previous manual process path
- Recovery target:
  - 30 minutes

## Definition of Ready (DoR)

- [x] Scope and constraints documented.
- [x] Leave contract draft created.
- [x] Role matrix reviewed by QA persona.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Contract governance checks pass in CI.
- [ ] Leave unit/integration tests are implemented and passing.
- [ ] Authorization and audit scenarios verified.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked if architecture/compatibility change is introduced.
