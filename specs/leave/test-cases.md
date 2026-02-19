# Leave Test Cases

## Scope

Leave request lifecycle, role authorization, fractional leave policy, and approved leave output compatibility for attendance/payroll.

## Functional Cases

1. Employee creates leave request in pending state.
2. Reject leave request/accrual actions when `employeeId` does not exist (404).
3. Employee updates pending request before approval.
4. Manager approves request and audit trail is appended.
5. Manager rejects request with mandatory reason.
6. Employee cancels pending request and final state is reflected.
7. Payroll operator settles yearly leave accrual for employee.
8. Admin/payroll operator upserts leave policy (grant/carry cap) and reads policy snapshot.
9. Accrual settlement uses leave policy defaults when request omits grant/cap fields.
10. List leave requests by period overlap (`from`/`to`) with role boundary guards (employee self-only, manager requires employeeId).
11. Employee creates and approves `HALF_DAY` leave request and balance usage deducts `0.5`.
12. Employee creates and approves `HOUR` leave request and balance usage deducts `hours/8`.
13. Policy denial returns `409` when `allowHalfDay=false` or `allowHourly=false`.
14. Policy validation rejects hourly requests that violate increment/maxHours rules.
15. Policy denial returns `409` when request start does not satisfy `minNoticeDays`.
16. Policy denial returns `409` when requested days exceed `maxConsecutiveDays`.
17. Updating policy with `maxConsecutiveDays=null` restores unlimited consecutive requests.
18. Leave policy updates annual promotion fields (`enabled`, `threshold`, `leadDays`, `template`) successfully.
19. Promotion preview excludes upcoming targets when notice window is closed and `includeUpcoming=false`.
20. Promotion preview returns threshold-matching targets and rendered announcement draft when window is open.
21. Promotion notify dry-run returns dispatch summary without sending webhook payload.
22. Promotion notify dispatch sends webhook when eligible targets exist in open notice window.
23. Promotion notify dispatch skips webhook when no display target exists.
24. Promotion notify dispatch fails with `503` when dispatch is required but webhook is not configured.

## Boundary and Accuracy Cases

1. Same-day leave request normalization in Asia/Seoul timezone.
2. Multi-day leave request spanning month boundary.
3. Overlapping leave requests for same employee are rejected.
4. Rejected/canceled requests are excluded from payable-time consumers.
5. Carry-over uses `min(max(remainingDays, 0), carryOverCapDays)`.
6. Same employee/year accrual settlement is rejected as duplicate.
7. Tenant-scoped policy read/write rejects cross-tenant access when tenancy is enabled.
8. Fractional leave balances keep two-decimal precision across approve/settle flows.
9. Existing full-day leave behavior remains backward compatible after fractional rollout.
10. Min notice day validation uses Asia/Seoul day boundary for today/start-date comparison.
11. Promotion notice window start/end is derived from Seoul year-end and policy lead days.
12. Promotion notify webhook payload keeps deterministic title/body and target summaries.

## Regression Linkage

- Future fixtures will be added under `qa/golden/fixtures` for leave+attendance impacts.
- Existing payroll fixtures must remain unaffected by leave contract introduction.
- Leave balance continuity must remain valid after yearly settlement.
- Fractional leave fixtures (`HALF_DAY`, `HOUR`) must remain deterministic across CI runs.
- Promotion preview fixtures remain deterministic for closed-window and open-window scenarios.
- Promotion notify fixtures remain deterministic for dry-run / no-target / dispatched / missing-webhook outcomes.

## QA Gate Expectations

- Spec Gate: leave contract completeness, role matrix, and invariant checks.
- Code Gate: unit/integration tests, authorization tests, audit log, and settlement idempotency assertions.
- Code Gate: promotion notify webhook side-effects are blocked in dry-run and validated in dispatch path.
