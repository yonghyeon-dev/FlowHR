# Attendance DB Notes

## Tables

- `AttendanceRecord`
  - `employeeId` → `Employee.id` (FK enforced; WI-0035)
- `AuditLog` (shared; created in WI-0001 migration extensions)

## Migrations

- `202602130001_init_wi0001`
- `202602130002_wi0001_api_extensions`
- `202602140006_employee_fk_constraints`

## Compatibility

- Expand-contract migration style.
- No cross-domain direct table access. Use API/event/projection.
