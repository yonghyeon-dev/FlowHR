# Attendance Test Cases

## Scope

Attendance create/update/approval behavior and output consistency for payroll aggregation.

## Functional Cases

1. Create attendance record within same business day.
2. Update attendance before approval.
3. Approve correction by manager role.
4. Reject attendance by manager role with optional reason and verify exclusion from payroll aggregation.
5. Reject unauthorized approval/rejection attempt.
6. Emit final-state event once (`approved` or `rejected`).
7. Rejection reason is preserved in audit/event payload when provided.
8. Reject API returns `400` for invalid JSON body and oversized reason payload.
9. List attendance records by period (`from`/`to`) with role boundary guards (employee self-only, manager requires employeeId).
10. List attendance aggregates by period (`from`/`to`) with role boundary guards and verify totals are derived from approved records only.

## Boundary and Accuracy Cases

1. Overnight shift crossing midnight is mapped using 04:00 workday boundary.
2. Minute rounding behavior matches common SSoT rules.
3. Correction after initial approval creates auditable recalculation signal.
4. Reject reason length `> 500` is blocked and does not create audit/event side effects.

## Regression Linkage

- `GC-001-standard-day.json`
- `GC-002-overnight-boundary.json`
- `GC-003-late-correction.json`
- `GC-005-retroactive-recalc.json`

## QA Gate Expectations

- Spec Gate: contract completeness and role matrix validated.
- Code Gate: unit/integration tests and fixture regression pass.
