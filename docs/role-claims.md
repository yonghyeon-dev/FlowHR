# Supabase Role Claims (FlowHR)

## Canonical Claim

- `app_metadata.role` is the single source of truth for authorization role mapping.

Allowed role values:

- `admin`
- `manager`
- `employee`
- `payroll_operator`
- `system`

## Tenant Claim (Organization)

- Canonical tenant claim: `app_metadata.organization_id`
- Non-prod fallback header (dev tooling only): `x-actor-organization-id`

Runtime rule:

- When `FLOWHR_TENANCY_V1=true`, all non-`system` actors must include a tenant context
  (JWT claim or header). Missing tenant context returns `401`.

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

## Backfill and Enforcement Commands

- Dry-run preview:
  - `npm run roles:backfill:dry`
- Apply backfill:
  - `npm run roles:backfill:apply`
- Enforce canonical claims (non-zero exit when violations exist):
  - `npm run roles:claims:enforce`

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`
