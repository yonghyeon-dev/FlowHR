# RFC: Tenancy / Tenant Isolation Baseline

## Goal

- Provide tenant isolation (Organization boundary) that is enforced in both:
  - application logic (scoped queries)
  - database policies (Supabase RLS)

## Non-goals

- Billing/subscription
- Membership invitations UI
- Org hierarchy, subsidiaries, multi-entity payroll

## Decisions

- Tenant id: `Organization.id`
- Claim mapping: `app_metadata.organization_id`
- Dev tooling fallback header (non-production): `x-actor-organization-id`

