# Tenancy (RLS) Test Cases

## Application Layer

- When `FLOWHR_TENANCY_V1=true`:
  - Cross-tenant access returns 404 for entity lookups (employee, payroll run, deduction profile).
  - List endpoints are implicitly scoped to the actor tenant.

## Database Layer (Supabase RLS)

- When calling Supabase Data API with an authenticated JWT that contains `app_metadata.organization_id`:
  - Reads/writes are limited to rows owned by that tenant.
  - System role (platform) can access all rows.

