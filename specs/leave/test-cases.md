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
25. Promotion notify dispatch sends email-template payload when `deliveryChannel=email_template` and recipients have email addresses.
26. Promotion notify email-template dispatch fails with `503` when email-template endpoint/from config is missing for required dispatch.
27. Promotion delivery history list endpoint returns channel/status filtered dispatch rows.
28. Promotion delivery history detail endpoint returns recipient snapshot statuses (`FAILED`, `SKIPPED_NO_EMAIL`, etc.).
29. Promotion delivery retry endpoint supports dry-run and real dispatch with retry-chain linkage.
30. Promotion delivery retry defaults to failed recipients when `recipientEmployeeIds` is omitted.
31. Accrual auto-grant dry-run returns per-employee statuses (`ELIGIBLE`, `ALREADY_SETTLED`, `NOT_ELIGIBLE`) without mutating balances.
32. Accrual auto-grant apply settles only eligible employees and reports failed rows without aborting whole batch.
33. Leave calendar query returns day summaries and entry list for organization/date range.
34. Leave calendar query applies `departmentId` filter to entries and day occupancy.
35. Leave calendar query includes pending requests in occupancy when `includePending=true`.
36. Leave policy list API returns `isStatutory` and `usageCount` for each policy row.
37. Leave policy delete rejects statutory policies with `400`.
38. Leave policy delete rejects policies with active leave-request usage with `400`.
39. Leave policy delete archives unused non-statutory policy and default list excludes archived rows.
40. Employee leave calendar query (`/leave/calendar/employee`) returns own + same-department entries with `PENDING/APPROVED/REJECTED` states and excludes other departments.
41. Existing organizations list `MATERNITY` and `PATERNITY` statutory leave policies after migration deployment.

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
13. Promotion notify email-template payload keeps deterministic template id/recipient summary and excludes recipients without email.
14. Promotion retry payload excludes recipients without email and keeps deterministic selected recipient set.
15. Promotion retry increments recipient retry count deterministically.
16. Accrual auto-grant `includeAlreadySettled=false` excludes already-settled rows from result list while keeping summary counts.
17. Leave calendar query treats `to` as exclusive period end and keeps day summaries deterministic in Asia/Seoul.

## Regression Linkage

- Future fixtures will be added under `qa/golden/fixtures` for leave+attendance impacts.
- Existing payroll fixtures must remain unaffected by leave contract introduction.
- Leave balance continuity must remain valid after yearly settlement.
- Fractional leave fixtures (`HALF_DAY`, `HOUR`) must remain deterministic across CI runs.
- Promotion preview fixtures remain deterministic for closed-window and open-window scenarios.
- Promotion notify fixtures remain deterministic for dry-run / no-target / dispatched / missing-webhook outcomes.
- Promotion notify fixtures remain deterministic for email-template dry-run / dispatched / missing-config outcomes.
- Promotion delivery history fixtures remain deterministic for failed-dispatch snapshots and retry-chain list/detail views.
- Accrual auto-grant fixtures remain deterministic for dry-run/apply/already-settled summary counts.
- Leave calendar fixtures remain deterministic for overlap warning threshold and department filter combinations.

## QA Gate Expectations

- Spec Gate: leave contract completeness, role matrix, and invariant checks.
- Code Gate: unit/integration tests, authorization tests, audit log, and settlement idempotency assertions.
- Code Gate: promotion notify side-effects (webhook/email-template) are blocked in dry-run and validated in dispatch path.
