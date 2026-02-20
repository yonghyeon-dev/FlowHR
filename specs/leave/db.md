# Leave DB Notes

## Planned Tables

- `LeaveRequest`
- `LeaveApproval`
- `LeaveBalanceProjection`
- `LeavePolicy`

## Referential Integrity (WI-0035)

- `LeaveRequest.employeeId` → `Employee.id` (FK enforced)
- `LeaveBalanceProjection.employeeId` → `Employee.id` (FK enforced)

## Migration

- `202602140001_wi0002_leave_base`
- `202602140002_wi0003_leave_accrual`
- `202602140006_employee_fk_constraints`
- `202602180002_leave_policy`
- `202602180005_leave_fractional_units`
- `202602190003_leave_policy_notice_consecutive`

## Additive Columns

- `LeaveBalanceProjection.carryOverDays` (decimal(6,2), default 0)
- `LeaveBalanceProjection.lastAccrualYear` (int, nullable)
- `LeavePolicy.allowHalfDay` (boolean, default true)
- `LeavePolicy.allowHourly` (boolean, default true)
- `LeavePolicy.hourlyIncrementMinutes` (int, default 30)
- `LeavePolicy.maxHoursPerRequest` (decimal(6,2), default 8)
- `LeavePolicy.minNoticeDays` (int, default 0)
- `LeavePolicy.maxConsecutiveDays` (decimal(6,2), nullable)

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access.
- Attendance/payroll consume approved leave via API/event/projection.
