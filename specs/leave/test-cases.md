# Leave Test Cases

## Scope

Leave request lifecycle, role authorization, and approved leave output compatibility for attendance/payroll.

## Functional Cases

1. Employee creates leave request in pending state.
2. Employee updates pending request before approval.
3. Manager approves request and audit trail is appended.
4. Manager rejects request with mandatory reason.
5. Employee cancels pending request and final state is reflected.
6. Payroll operator settles yearly leave accrual for employee.
7. List leave requests by period overlap (`from`/`to`) with role boundary guards (employee self-only, manager requires employeeId).

## Boundary and Accuracy Cases

1. Same-day leave request normalization in Asia/Seoul timezone.
2. Multi-day leave request spanning month boundary.
3. Overlapping leave requests for same employee are rejected.
4. Rejected/canceled requests are excluded from payable-time consumers.
5. Carry-over uses `min(max(remainingDays, 0), carryOverCapDays)`.
6. Same employee/year accrual settlement is rejected as duplicate.

## Regression Linkage

- Future fixtures will be added under `qa/golden/fixtures` for leave+attendance impacts.
- Existing payroll fixtures must remain unaffected by leave contract introduction.
- Leave balance continuity must remain valid after yearly settlement.

## QA Gate Expectations

- Spec Gate: leave contract completeness, role matrix, and invariant checks.
- Code Gate: unit/integration tests, authorization tests, audit log, and settlement idempotency assertions.
