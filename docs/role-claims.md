# Supabase Role Claims (FlowHR)

## Canonical Claim

- `app_metadata.role` is the single source of truth for authorization role mapping.

Allowed role values:

- `admin`
- `manager`
- `employee`
- `payroll_operator`
- `system`

## Compatibility

- Legacy fallback claims are temporarily accepted:
  - `user_metadata.role`
  - `app_metadata.user_role`
  - `user_metadata.user_role`
- New tokens and onboarding flows must write `app_metadata.role`.

## Practical Rules

- Attendance approve: `admin`, `manager`
- Payroll preview/confirm: `admin`, `payroll_operator`
- Attendance create/update:
  - `admin`, `manager`: any employee
  - `employee`: only own employee ID

## Migration Note

- Existing users should be backfilled to `app_metadata.role`.
- After migration stabilization, legacy fallbacks can be removed via ADR.
