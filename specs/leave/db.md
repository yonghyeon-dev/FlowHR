# Leave DB Notes

## Planned Tables

- `leave_requests`
- `leave_approvals`
- `leave_balances_projection`

## Migration

- `202602140001_wi0002_leave_base`

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access.
- Attendance/payroll consume approved leave via API/event/projection.
