# Leave RFC (WI-0002)

## Goal

Define contract-first leave request and approval behavior with auditability and downstream compatibility for attendance/payroll.

## Key Decisions

- Request/approval state transitions are explicit and append-only in audit trail.
- Authorization is role-gated with self-service boundary for employees.
- Approved leave events are published for attendance/payroll consumers.

## Non-Goals

- Leave accrual settlement engine.
- External calendar synchronization.
- Country-specific leave law expansions beyond KR baseline.
