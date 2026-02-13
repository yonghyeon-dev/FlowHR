# Leave DB Notes

## Planned Tables

- `LeaveRequest`
- `LeaveApproval`
- `LeaveBalanceProjection`

## Migration

- `202602140001_wi0002_leave_base`
- `202602140002_wi0003_leave_accrual`

## WI-0003 Additive Columns

- `LeaveBalanceProjection.carryOverDays` (int, default 0)
- `LeaveBalanceProjection.lastAccrualYear` (int, nullable)

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access.
- Attendance/payroll consume approved leave via API/event/projection.
