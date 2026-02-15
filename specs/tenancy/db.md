# Tenancy (RLS) Database Notes

## Tenant Identifier

- Tenant boundary is `Organization.id` (`organizationId` in tables).

## Supabase JWT Claims

- `app_metadata.role`: authorization role (SSoT)
- `app_metadata.organization_id`: tenant scope (SSoT)

## RLS Strategy

- Enable RLS on core tables.
- Policies:
  - `system` role bypass
  - otherwise `organizationId` must match JWT claim
  - for tables without a direct `organizationId`, enforce via `Employee.organizationId` join.

