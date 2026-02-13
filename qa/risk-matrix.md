# QA Risk Matrix

## Risk Levels

| Level | Description | Release Rule |
| --- | --- | --- |
| Low | Cosmetic or non-critical internal impact | Standard gate |
| Medium | Functional issue with limited scope | Standard gate plus focused regression |
| High | Core flow risk, payroll accuracy, or authorization impact | Extended regression and explicit QA sign-off |
| Critical | Security incident, legal risk, or production outage | Break-glass policy only |

## Mandatory Audit Event Coverage

- Attendance record created/updated/deleted.
- Approval actions (submit/approve/reject/cancel).
- Payroll calculation executed/confirmed.
- Leave accrual settlement applied/rejected.
- Authorization and role change actions.

## Payroll and Timekeeping Risks

- Overnight shift boundary handling.
- Overtime, night, holiday multipliers.
- Rounding effects on payable amount.
- Retroactive correction and recalculation.
- Leave carry-over cap misapplication and duplicate-year settlement.

## Migration Safety Risks

- Backfill correctness.
- Expand/contract transition compatibility.
- Rollback feasibility under load.
