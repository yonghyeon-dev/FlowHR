# WI-0037: Multi-Tenant Isolation Baseline (Supabase RLS)

## Background and Problem

FlowHR currently behaves as a single-tenant system. For production SaaS, tenant isolation must be guaranteed at the database level (RLS), not only at the application layer.

## Scope

### In Scope

- Define tenant identifier model and how it maps to Supabase JWT claims.
- Add tenantId fields to core tables (additive first).
- Implement Supabase RLS policies to enforce tenant isolation for read/write.
- Update server-side access patterns to always scope by tenant.

### Out of Scope

- Multi-region deployments.
- Tenant billing and subscription management.

## User Scenarios

1. Users from tenant A cannot read or mutate tenant B data (even with direct DB access via API).
2. Admin tooling can operate within a tenant boundary safely.

## Payroll Accuracy and Calculation Rules

- Not applicable.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Access tenant-scoped data | Allow (within tenant) | Allow (within tenant) | Allow (within tenant) | N/A |

## Data Changes (Tables and Migrations)

- Tenant id: Organization.id (actor claim: app_metadata.organization_id)
- Tables (RLS enforced): `Organization`, `Employee`, `AttendanceRecord`, `LeaveRequest`, `LeaveApproval`, `LeaveBalanceProjection`, `PayrollRun`, `DeductionProfile`, `AuditLog`
- Migration IDs: `202602150002_tenant_rls_baseline`
- Backward compatibility plan:
  - Additive columns first (PayrollRun.organizationId, DeductionProfile.organizationId, AuditLog.organizationId)
  - Best-effort backfill for existing rows
  - App-level enforcement behind feature flag FLOWHR_TENANCY_V1 (default off)
  - Enable RLS policies (Supabase)

## API and Event Changes

- Endpoints: all core endpoints must require tenant context
- Events published: none
- Events consumed: none

## Test Plan

- Unit: tenant scoping helpers
- Integration: RLS policy prevents cross-tenant access
- Regression: existing e2e flows updated to include tenant context and remain green

## Observability and Audit Logging

- Audit events: tenant context applied to sensitive actions
- Metrics: cross-tenant denial counts (optional)
- Alert conditions: none initially

## Rollback Plan

- Feature flag behavior: allow RLS enforcement rollout in stages
- DB rollback method: disable policies if required (break-glass)
- Recovery target time: 60m

## Definition of Ready (DoR)

- [x] Tenant model and claim mapping decided. (`Organization.id` + `app_metadata.organization_id`)
- [ ] RLS policy strategy drafted and reviewed.

## Definition of Done (DoD)

- [ ] RLS enforces tenant isolation for core tables.
- [ ] Cross-tenant access tests exist and pass.
- [ ] CI remains green.

