# ADR-0004: Multi-Tenant Isolation Baseline (Supabase RLS)

- Status: Proposed
- Date: 2026-02-15
- Owners: FlowCoder
- Related Work Item: `work-items/WI-0037-multi-tenant-rls-baseline.md`
- Related Contracts:
  - `specs/tenancy/contract.yaml`
  - `specs/attendance/contract.yaml`
  - `specs/leave/contract.yaml`
  - `specs/payroll/contract.yaml`

## Context

FlowHR is evolving from a single-tenant prototype into a production SaaS. Tenant isolation must be enforced at
the database layer (Supabase/Postgres RLS), not only by application filters.

If tenant boundaries are not enforced consistently:

- cross-tenant reads/writes become possible (privacy/compliance failure)
- audit trails lose trustworthiness (unclear which tenant an action belongs to)
- future integrations (analytics, exports, payroll) become unsafe

## Decision

1. Tenant boundary:
   - A tenant is an `Organization`.
   - Canonical tenant identifier is `Organization.id`.
2. Actor tenant claim:
   - Canonical claim: `app_metadata.organization_id` in Supabase JWT.
   - Non-production fallback header for local/dev tools only: `x-actor-organization-id`.
3. Authorization role claim:
   - Canonical role claim remains `app_metadata.role` (see `docs/role-claims.md`).
   - `system` role is allowed to bypass tenant scope for platform operations.
4. Database enforcement:
   - Enable RLS and define baseline tenant-isolation policies for core tables in migration
     `202602150002_tenant_rls_baseline`.
   - Where a table does not have `organizationId`, RLS policies join through `Employee.organizationId`.
5. Application-layer scoping:
   - Enforce tenant scoping in services behind feature flag `FLOWHR_TENANCY_V1` (default off) to allow staged rollout.
   - Prefer `404` for entity lookups when tenant mismatch occurs (avoid tenant enumeration).

## Alternatives Considered

1. Application-only scoping (no RLS)
   - Pros: simplest deployment.
   - Cons: does not protect against direct DB/API access; unacceptable for SaaS privacy guarantees.
2. Separate Supabase project per tenant
   - Pros: hard isolation.
   - Cons: high operational overhead; not aligned with MVP speed and multi-tenant SaaS model.
3. Use a different claim location (e.g., `user_metadata.*`)
   - Pros: easier to mutate from clients.
   - Cons: weaker canonical source; less consistent for policy enforcement and governance.

## Consequences

- Positive:
  - Strong tenant isolation guarantees at the database layer.
  - Audit logs can carry tenant context reliably.
  - Safer foundation for future features (exports, payroll, integrations).
- Negative:
  - Requires careful rollout to avoid locking out legitimate traffic if tenant claim is missing.
  - RLS policies add complexity to debugging and operational workflows.

## Compatibility and Migration

- Backward compatibility:
  - Additive first (new columns: `PayrollRun.organizationId`, `DeductionProfile.organizationId`, `AuditLog.organizationId`).
  - Best-effort backfill for existing rows where possible.
- Rollout strategy:
  - Keep `FLOWHR_TENANCY_V1` off by default to validate RLS behavior gradually.
  - Turn on in staging first, then production with monitoring and rollback plan.
- Rollback strategy:
  - Disable `FLOWHR_TENANCY_V1`.
  - If required, disable/adjust RLS policies via break-glass procedure (`docs/break-glass.md`).

## Security and Compliance Impact

- This is a privacy/compliance-critical change: tenant isolation failures are treated as P0 incidents.
- No new PII fields are introduced, but access paths are constrained by tenant context.

## Validation Plan

- Tests:
  - Integration/e2e coverage for cross-tenant denial when `FLOWHR_TENANCY_V1=true`.
  - Existing flows remain green when the flag is off (default).
- Operational checks:
  - Verify JWT claim propagation (`app_metadata.organization_id`) in staging.
  - Verify RLS policies for read/write paths across attendance/leave/payroll tables.

