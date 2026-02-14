# WI-0031: Attendance Aggregates API (근태 집계 조회)

## Background and Problem

Payroll preview currently derives payable minutes by reading approved attendance records, but there is no explicit API
to inspect the underlying attendance aggregation result (regular/overtime/night/holiday totals) per employee.
The MVP console and future UI need a stable endpoint to validate aggregation outcomes and spot anomalies before payroll.

## Scope

### In Scope

- Add `GET /attendance/aggregates` to return payable-minute totals grouped by employee for a period.
- Query:
  - required: `from`, `to` (ISO datetime with offset)
  - optional: `employeeId`
- Aggregation rules:
  - totals are computed from `APPROVED` attendance records only
  - records without `checkOutAt` do not contribute to totals
  - rejected records are excluded from totals (but still counted in state counts)
- Authorization:
  - `employee`: allow self-only (defaults to actor id when `employeeId` is omitted)
  - `manager`: allow only with explicit `employeeId`
  - `admin`, `payroll_operator`: allow (with or without `employeeId`)

### Out of Scope

- Pagination / cursor APIs.
- Per-day breakdowns and scheduled shift comparison.
- Org hierarchy based manager scoping (future).

## User Scenarios

1. Employee verifies aggregated payable minutes for their own month before payroll.
2. Payroll operator aggregates all employees in a period to detect outliers.
3. Manager checks a specific employee's aggregates after approving records.

## Payroll Accuracy and Calculation Rules

- Source of truth: persisted attendance records in DB.
- Minute categorization follows `specs/common/time-and-payroll-rules.md` and matches payroll preview behavior.
- Time zone: `Asia/Seoul`.
- Workday boundary: `04:00`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| List attendance aggregates | Allow | Allow (employeeId required) | Allow (self-only) | Allow |

## Data Changes (Tables and Migrations)

- Tables: none
- Migrations: none (additive API only)

## API and Event Changes

- Endpoints:
  - `GET /attendance/aggregates`
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - query parsing and ISO offset normalization
  - aggregation totals computed from approved records only
  - role guard boundaries (employee self-only; manager requires employeeId)
- Integration:
  - aggregates include expected totals for approved record
  - rejected record does not contribute to totals but increases rejected count
- Regression:
  - WI-0001 payroll gross pay output remains unchanged (uses same derivation rules)

## Observability and Audit Logging

- Audit events: none (read-only endpoint)
- Metrics: none for MVP
- Alert conditions: none for MVP

## Rollback Plan

- Feature flag behavior: not applicable (additive endpoint)
- Recovery: revert route/service and contract changes

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Contract + API spec updates prepared.
- [x] Role matrix reviewed by QA persona.
- [x] No DB migration required.
- [x] Rollback plan defined.

## Definition of Done (DoD)

- [ ] Contract/API/test-cases updated with SemVer bump and consumer impact.
- [ ] Implementation matches contract invariants.
- [ ] Required unit/e2e tests pass (memory + prisma).
- [ ] QA Spec Gate and Code Gate are satisfied.

