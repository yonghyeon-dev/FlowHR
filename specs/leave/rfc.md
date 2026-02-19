# Leave RFC (WI-0002 + WI-0003 + WI-0090 + WI-0104 + WI-0114)

## Goal

Define contract-first leave lifecycle plus yearly accrual settlement and fractional leave behavior with auditability and downstream compatibility for attendance/payroll.

## Key Decisions

- Request/approval state transitions are explicit and append-only in audit trail.
- Authorization is role-gated with self-service boundary for employees.
- Approved leave events are published for attendance/payroll consumers.
- Yearly accrual settlement applies carry-over cap and blocks duplicate-year settlement.
- Leave request unit is explicit (`FULL_DAY`, `HALF_DAY`, `HOUR`) and drives balance deduction.
- Hourly leave is policy-controlled by increment and max-hours constraints.
- Leave request admission is policy-controlled by minimum advance notice and optional max consecutive-day cap.
- Leave balance projection keeps decimal precision (`Decimal(6,2)`) for fractional day accounting.

## Non-Goals

- External calendar synchronization.
- Country-specific leave law expansions beyond KR baseline.
- Automatic batch scheduling for accrual settlement.
