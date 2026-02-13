# Leave RFC (WI-0002 + WI-0003)

## Goal

Define contract-first leave lifecycle plus yearly accrual settlement behavior with auditability and downstream compatibility for attendance/payroll.

## Key Decisions

- Request/approval state transitions are explicit and append-only in audit trail.
- Authorization is role-gated with self-service boundary for employees.
- Approved leave events are published for attendance/payroll consumers.
- Yearly accrual settlement applies carry-over cap and blocks duplicate-year settlement.

## Non-Goals

- External calendar synchronization.
- Country-specific leave law expansions beyond KR baseline.
- Automatic batch scheduling for accrual settlement.
