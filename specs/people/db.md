# People Domain DB

## Tables

### Organization

- `id` (PK, cuid)
- `name`
- `createdAt`, `updatedAt`

### Employee

- `id` (PK, string)
  - Canonical identifier. Recommended to use Supabase `auth.users.id` (UUID string) for production.
- `organizationId` (nullable FK -> Organization.id)
- `name` (nullable)
- `email` (nullable)
- `active` (boolean, default true)
- `createdAt`, `updatedAt`

## Notes

- This phase is additive only and does not enforce cross-domain FK relationships yet.
- Tenant isolation (RLS) will be introduced in a later Phase 1 WI.

