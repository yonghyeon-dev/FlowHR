# WI-0114: Leave Policy Notice and Consecutive-Day Constraints

## Background and Problem

Current leave policy supports fractional units and hourly constraints, but it cannot enforce advance-request windows or long consecutive leave caps. This blocks common HR policy needs for staffing predictability.

## Scope

### In Scope

- Extend leave policy with `minNoticeDays` and `maxConsecutiveDays`.
- Enforce policy constraints in leave request create/update flows.
- Allow `maxConsecutiveDays=null` for unlimited mode.
- Expose new fields through leave policy read/write API and admin UI.
- Add e2e regression coverage for deny/allow transitions.

### Out of Scope

- Leave promotion/legal notice campaign automation.
- Country-specific legal calculations beyond current KR baseline.
- Manager override bypass for policy constraints.

## User Scenarios

1. Admin sets `minNoticeDays=2`, then employee requests tomorrow leave and gets blocked.
2. Admin sets `maxConsecutiveDays=3`, then 4-day leave request is blocked.
3. Admin clears consecutive cap (`null`), then longer leave request is allowed.

## Payroll Accuracy and Calculation Rules

- Leave-day deduction formula is unchanged.
- Policy constraints only affect request admission, not balance arithmetic.

## Authorization and Role Matrix

| Action | Admin | Payroll Operator | Manager | Employee | System |
| --- | --- | --- | --- | --- | --- |
| Update leave policy constraints | Allow | Allow | Deny | Deny | Allow |
| Create leave request subject to constraints | Allow | Allow | Allow | Allow | Allow |
| Read leave policy constraints | Allow | Allow | Allow | Deny | Allow |

## Data Changes

- Tables: `LeavePolicy`
- Migration IDs: `202602190003_leave_policy_notice_consecutive`
- Backward compatibility: additive nullable/non-breaking columns.

## API and Event Changes

- Endpoints:
  - `GET /leave/policy` (returns `minNoticeDays`, `maxConsecutiveDays`)
  - `PUT /leave/policy` (accepts `minNoticeDays`, `maxConsecutiveDays`)
- Events published:
  - `leave.policy.updated.v1` (payload extended with new fields)
- Events consumed: none

## Test Plan

- Unit:
  - min notice validation by Seoul day boundary
  - max consecutive day cap validation
- Integration:
  - create/update leave request constraint deny paths (`409`)
  - policy read/write roundtrip includes new fields
- Regression:
  - `maxConsecutiveDays=null` restores unlimited mode
- Authorization:
  - policy mutation role checks remain unchanged
- Payroll accuracy:
  - balance deduction remains deterministic for approved requests

## Observability and Audit Logging

- Audit events:
  - `leave.policy_read`
  - `leave.policy_updated`
  - `leave.requested`
- Metrics:
  - `leave_policy_denied_count`
  - `leave_request_rejection_rate`
- Alert conditions:
  - repeated notice-day policy denials after policy update.

## Rollback Plan

- Set `minNoticeDays=0` and `maxConsecutiveDays=null` to disable constraints.
- Revert migration/service/UI changes if false denials occur.
- Recovery target: 30m.

## Definition of Ready (DoR)

- [x] Requirements are specific and testable.
- [x] Contract/API/Testcases update scope is defined.
- [x] DB migration impact is reviewed.
- [x] QA deny/allow scenarios are enumerated.

## Definition of Done (DoD)

- [x] Leave policy schema/store/service include notice/consecutive fields.
- [x] Create/update leave flows enforce configured constraints.
- [x] Admin leave-policy UI supports editing both fields.
- [x] WI-0114 e2e regression is added to MVP/FULL suites.
- [x] Contract/API/docs updated and CI checks pass.
