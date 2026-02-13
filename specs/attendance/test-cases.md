# Attendance Test Cases

## Scope

Attendance create/update/approval behavior and output consistency for payroll aggregation.

## Functional Cases

1. Create attendance record within same business day.
2. Update attendance before approval.
3. Approve correction by manager role.
4. Reject attendance by manager role and verify exclusion from payroll aggregation.
5. Reject unauthorized approval/rejection attempt.
6. Emit final-state event once (`approved` or `rejected`).

## Boundary and Accuracy Cases

1. Overnight shift crossing midnight is mapped using 04:00 workday boundary.
2. Minute rounding behavior matches common SSoT rules.
3. Correction after initial approval creates auditable recalculation signal.

## Regression Linkage

- `GC-001-standard-day.json`
- `GC-002-overnight-boundary.json`
- `GC-003-late-correction.json`
- `GC-005-retroactive-recalc.json`

## QA Gate Expectations

- Spec Gate: contract completeness and role matrix validated.
- Code Gate: unit/integration tests and fixture regression pass.
